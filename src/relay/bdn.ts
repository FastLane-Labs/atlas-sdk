import { toQuantity, keccak256 } from "ethers";
import { WebSocket } from "ws";
import { createECDH, createSign } from "crypto";
import { BaseOperationRelay } from "./base";
import { OperationBuilder } from "../operation/builder";
import { UserOperation, SolverOperation, Bundle } from "../operation";
import { getUserOperationHash } from "../utils";

const DEFAULT_AUCTION_DURATION = 2000; // 2 seconds

export class BdnOperationsRelay extends BaseOperationRelay {
  private wsConn: WebSocket;
  private dAppPrivateKey: string;
  private dAppPublicKey: string;
  private auctionDuration: number; // Milliseconds
  private userOpHashToIntentId: { [userOpHash: string]: string } = {};
  private auctionsStartTime: { [intentId: string]: number } = {};
  private collectedSolverOps: { [intentId: string]: SolverOperation[] } = {};
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
  constructor(params: { [k: string]: string }) {
    super(params);

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

    let solverOp: SolverOperation;
    try {
      solverOp = OperationBuilder.newSolverOperation(data.intentSolution);
    } catch (e) {
      console.error("BdnOperationsRelay: Error parsing solution:", e);
      return;
    }

    this.collectedSolverOps[data.intentId].push(solverOp);
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
    return new Promise((resolve, reject) => {
      const intent = Buffer.from(
        JSON.stringify(
          {
            userOperation: userOp.toStruct(),
            hints: hints,
          },
          (_, v) => (typeof v === "bigint" ? toQuantity(v) : v)
        )
      );
      const hash = keccak256(intent);

      // Generate sender private key
      const pk = createECDH("secp256k1");
      const pubKey = pk.generateKeys("hex", "compressed");

      const m = {
        dappAddress: this.dAppPublicKey,
        senderAddress: pubKey,
        intent: intent.toString("hex"),
        hash: hash,
        signature: createSign("SHA256")
          .update(hash)
          .end()
          .sign(pk.getPrivateKey("hex"), "hex"),
      };

      const msgId = ++this.rpcIdCounter;
      const respHandler = (data: any) => {
        console.log("BdnOperationsRelay: Submitted intent, resp:", data);
        const userOpHash = getUserOperationHash(userOp);
        this.userOpHashToIntentId[userOpHash] = data.intentId;
        this.auctionsStartTime[data.intentId] = Date.now();
        resolve(userOpHash);
      };

      this.rpcResponseHandlers[msgId] = respHandler.bind(this, [
        resolve,
        reject,
      ]);

      const req = JSON.stringify({
        id: msgId,
        method: "blxr_submit_intent",
        params: m,
      });

      this.wsConn.send(req, (err) => {
        if (err) {
          return reject(err);
        }
      });
    });
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
    const intentId = this.userOpHashToIntentId[userOpHash];
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
    delete this.userOpHashToIntentId[userOpHash];
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
    //TODO:
    return "Not implemented";
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
    //TODO:
    return "Not implemented";
  }
}
