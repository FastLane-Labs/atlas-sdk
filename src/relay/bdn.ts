import { toQuantity, keccak256 } from "ethers";
import { WebSocket } from "ws";
import { createECDH, createSign } from "crypto";
import { BaseOperationRelay } from "./base";
import { OperationBuilder } from "../operation/builder";
import { UserOperation, SolverOperation, Bundle } from "../operation";
import { getUserOperationHash, validateBytes32 } from "../utils";

const DEFAULT_AUCTION_DURATION = 2000; // 2 seconds

enum IntentType {
  USER_OPERATION,
  BUNDLE,
}

interface SubmitIntentRequest {
  dappAddress: string;
  senderAddress: string;
  intent: string;
  hash: string;
  signature: string;
}

function buildIntentRequest(
  intent: Buffer,
  dAppPublicKey: string
): SubmitIntentRequest {
  const hash = keccak256(intent);

  // Generate sender private key
  const pk = createECDH("secp256k1");
  const pubKey = pk.generateKeys("hex", "compressed");

  return {
    dappAddress: dAppPublicKey,
    senderAddress: pubKey,
    intent: intent.toString("hex"),
    hash: hash,
    signature: createSign("SHA256")
      .update(hash)
      .end()
      .sign(pk.getPrivateKey("hex"), "hex"),
  };
}

export class BdnOperationsRelay extends BaseOperationRelay {
  private wsConn: WebSocket;
  private dAppPrivateKey: string;
  private dAppPublicKey: string;
  private auctionDuration: number; // Milliseconds
  private userOpHashToIntentIdUserOp: { [userOpHash: string]: string } = {};
  private userOpHashToIntentIdBundle: { [userOpHash: string]: string } = {};
  private auctionsStartTime: { [intentId: string]: number } = {};
  private collectedSolverOps: { [intentId: string]: SolverOperation[] } = {};
  private collectedBundleHashes: { [intentId: string]: string } = {};
  private rpcResponseHandlers: { [msgId: string]: (data: any) => void } = {};
  private rpcSubscriptionHandlers: { [subId: string]: (data: any) => void } =
    {};
  private rpcIdCounter: number = 0;

  /**
   *
   * @param params [wsEndpoint] The WebSocket endpoint of the BDN
   *               [auth] The authorization token for the BDN
   *               [auctionDuration] The duration of the auction in milliseconds
   */
  constructor(chainId: number, params: { [k: string]: string }) {
    super(chainId, params);

    // Generate dApp private key
    const pk = createECDH("secp256k1");
    this.dAppPublicKey = pk.generateKeys("hex", "compressed");
    this.dAppPrivateKey = pk.getPrivateKey("hex");

    // Set auction duration
    this.auctionDuration =
      parseInt(params["auctionDuration"]) || DEFAULT_AUCTION_DURATION;

    // Init connection to the BDN
    this.wsConn = this.initWebsocket();
  }

  private initWebsocket(): WebSocket {
    // Init websocket connection
    const wsConn = new WebSocket(this.params["wsEndpoint"], {
      headers: {
        Authorization: this.params["auth"],
      },
    });

    // Subscribe to solutions when ready
    wsConn.on("open", () => {
      console.log("BdnOperationsRelay: WebSocket connection established.");
      this.subscribeToSolutions();
    });

    // Handle incoming messages
    wsConn.on("message", (data) => {
      console.log(
        "BdnOperationsRelay: WebSocket message received:",
        data.toString()
      );

      let response: any;

      try {
        response = JSON.parse(data.toString());
      } catch (e) {
        console.error(
          "BdnOperationsRelay: Error parsing WebSocket message:",
          e
        );
        return;
      }

      // This is a response to one of our calls
      if (response.id) {
        const handler = this.rpcResponseHandlers[response.id];
        if (handler) {
          handler(response.result);
          delete this.rpcResponseHandlers[response.id];
        } else {
          console.error(
            "BdnOperationsRelay: No handler for response with id:",
            response.id
          );
        }
      }

      // This is a subscription message
      else if (response.method === "subscription") {
        const handler =
          this.rpcSubscriptionHandlers[response.params.subscription];
        if (handler) {
          handler(response.params.result);
          delete this.rpcSubscriptionHandlers[response.params.subscription];
        } else {
          console.error(
            "BdnOperationsRelay: No handler for subscription with id:",
            response.params.subscription
          );
        }
      }

      // Unhandled message
      else {
        console.error("BdnOperationsRelay: Unhandled message:", response);
      }
    });

    // Handle errors
    wsConn.on("error", (error) => {
      console.error("BdnOperationsRelay: WebSocket error:", error);
      // Reconnect
      wsConn.close();
      this.wsConn = this.initWebsocket();
    });

    return wsConn;
  }

  private subscribeToSolutions(): void {
    const hash = keccak256(this.dAppPublicKey);
    const m = {
      dappAddress: this.dAppPublicKey,
      hash: hash,
      signature: createSign("SHA256")
        .update(hash)
        .end()
        .sign(this.dAppPrivateKey, "hex"),
    };

    const msgId = ++this.rpcIdCounter;
    const respHandler = (data: any) => {
      // data is the subscription ID
      console.log("BdnOperationsRelay: Subscribed to solutions with ID:", data);
      this.rpcSubscriptionHandlers[data] =
        this.solutionsSubscriptionHandler.bind(this);
    };

    this.rpcResponseHandlers[msgId] = respHandler.bind(this);

    const req = JSON.stringify({
      id: msgId,
      method: "subscribe",
      params: ["userIntentSolutionsFeed", m],
    });

    this.wsConn.send(req, (err) => {
      if (err) {
        console.error(
          "BdnOperationsRelay: Failed to subscribe to solutions:",
          err
        );
      }
    });
  }

  private solutionsSubscriptionHandler(data: any): void {
    console.log("BdnOperationsRelay: Received solution:", data);

    // We're expecting either a bundle hash or a solver operation

    // Check if it's a bundle hash
    try {
      if (!validateBytes32(data.intentSolution)) throw "Invalid bundle hash";
      this.collectedBundleHashes[data.intentId] = data.intentSolution;
      return;
    } catch (e) {}

    // Check if it's a solver operation
    try {
      // Will throw if invalid
      const solverOp = OperationBuilder.newSolverOperation(data.intentSolution);

      const auctionStartTime = this.auctionsStartTime[data.intentId];
      if (!auctionStartTime) {
        console.error("BdnOperationsRelay: No auction start time found");
        return;
      }

      const elapsed = Date.now() - auctionStartTime;
      if (elapsed > this.auctionDuration) {
        console.error("BdnOperationsRelay: Auction expired");
        return;
      }

      this.collectedSolverOps[data.intentId].push(solverOp);
    } catch (e) {}

    console.error("BdnOperationsRelay: Unhandled solution:", data);
  }

  private sendIntentRequest(
    intentType: IntentType,
    userOpHash: string,
    intentRequest: SubmitIntentRequest
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const msgId = ++this.rpcIdCounter;
      const respHandler = (data: any) => {
        console.log(
          `BdnOperationsRelay: Submitted intent type ${IntentType[intentType]}, resp:`,
          data
        );
        if (intentType === IntentType.USER_OPERATION) {
          this.userOpHashToIntentIdUserOp[userOpHash] = data.intentId;
          this.auctionsStartTime[data.intentId] = Date.now();
          resolve(userOpHash);
        } else if (intentType === IntentType.BUNDLE) {
          this.userOpHashToIntentIdBundle[userOpHash] = data.intentId;
          resolve("Bundle submitted");
        }
      };

      this.rpcResponseHandlers[msgId] = respHandler.bind(this, [
        resolve,
        reject,
      ]);

      const req = JSON.stringify({
        id: msgId,
        method: "blxr_submit_intent",
        params: intentRequest,
      });

      this.wsConn.send(req, (err) => {
        if (err) {
          return reject(err);
        }
      });
    });
  }

  /**
   * Submit a user operation to the relay
   * @summary Submit a user operation to the relay
   * @param {UserOperation} [userOp] The user operation
   * @param {string[]} [hints] Hints for solvers
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The hash of the user operation
   */
  public async _submitUserOperation(
    userOp: UserOperation,
    hints: string[],
    extra?: any
  ): Promise<string> {
    const intent = Buffer.from(
      JSON.stringify(
        {
          chainId: toQuantity(this.chainId),
          userOperation: userOp.toStruct(),
          hints: hints,
        },
        (_, v) => (typeof v === "bigint" ? toQuantity(v) : v)
      )
    );

    return this.sendIntentRequest(
      IntentType.USER_OPERATION,
      getUserOperationHash(userOp),
      buildIntentRequest(intent, this.dAppPublicKey)
    );
  }

  /**
   * Get solver operations for a user operation previously submitted
   * @summary Get solver operations for a user operation previously submitted
   * @param {UserOperation} [userOp] The user operation
   * @param {string} userOpHash The hash of the user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [extra] Extra parameters
   * @returns {Promise<SolverOperation[]>} The solver operations
   */
  public async _getSolverOperations(
    _: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any
  ): Promise<SolverOperation[]> {
    const intentId = this.userOpHashToIntentIdUserOp[userOpHash];
    if (!intentId) {
      throw "No intent ID found for user operation hash";
    }

    const auctionStartTime = this.auctionsStartTime[intentId];
    if (!auctionStartTime) {
      throw "No auction start time found";
    }

    let elapsed = Date.now() - auctionStartTime;
    while (wait && elapsed < this.auctionDuration) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.auctionDuration - elapsed)
      );
    }

    elapsed = Date.now() - auctionStartTime;
    if (elapsed < this.auctionDuration) {
      throw "Auction still ongoing";
    }

    const solverOps = this.collectedSolverOps[intentId];
    delete this.collectedSolverOps[intentId];
    delete this.userOpHashToIntentIdUserOp[userOpHash];
    delete this.auctionsStartTime[intentId];

    return solverOps;
  }

  /**
   * Submit user/solvers/dApp operations to the relay for bundling
   * @summary Submit a bundle of user/solvers/dApp operations to the relay
   * @param {Bundle} [bundle] The user/solvers/dApp operations to be bundled
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The result message
   */
  public async _submitBundle(bundle: Bundle, extra?: any): Promise<string> {
    const intent = Buffer.from(
      JSON.stringify(
        {
          chainId: toQuantity(this.chainId),
          userOperation: bundle.userOperation.toStruct(),
          solverOperations: bundle.solverOperations.map((op) => op.toStruct()),
          dAppOperation: bundle.dAppOperation.toStruct(),
        },
        (_, v) => (typeof v === "bigint" ? toQuantity(v) : v)
      )
    );

    return this.sendIntentRequest(
      IntentType.BUNDLE,
      getUserOperationHash(bundle.userOperation),
      buildIntentRequest(intent, this.dAppPublicKey)
    );
  }

  /**
   * Get the Atlas transaction hash from a previously submitted bundle
   * @summary Get the Atlas transaction hash from a previously submitted bundle
   * @param {string} userOpHash The hash of the user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The Atlas transaction hash
   */
  public async _getBundleHash(
    userOpHash: string,
    wait?: boolean,
    extra?: any
  ): Promise<string> {
    const intentId = this.userOpHashToIntentIdBundle[userOpHash];
    if (!intentId) {
      throw "No intent ID found for user operation hash";
    }

    let bundleHash: string;

    while (true) {
      bundleHash = this.collectedBundleHashes[intentId];
      if (bundleHash || !wait) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!bundleHash) {
      throw "No bundle hash found";
    }

    delete this.collectedBundleHashes[intentId];
    delete this.userOpHashToIntentIdBundle[userOpHash];

    return bundleHash;
  }
}
