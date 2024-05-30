import { BaseOperationRelay } from "./base";
import { OperationBuilder } from "../operation/builder";
import { UserOperation, SolverOperation, Bundle } from "../operation";
import { WebSocket } from "ws";
import * as crypto from "crypto";

interface IntentSolutionsReply {
  intentId: string;
  intentSolution: string; // byte[] in the doc spec, but we'll handle it as a base64-encoded string for JSON parsing
}

export class BdnOperationsRelay extends BaseOperationRelay {
  protected ws: WebSocket;
  private collectedSolutions: IntentSolutionsReply[] = [];
  private dappAddress;
  
  constructor(params: { [k: string]: string }) {
    super(params);

    this.dappAddress = params["dappAddress"];

    this.ws = new WebSocket(this.params["opsRelayWsUrl"], {
        headers: {
          Authorization: this.params["auth-header"],
        },
      });
  
    this.ws.on("open", () => {
    console.log("WebSocket connection established.");
      this.subscribeToSolutions();
    });

    this.ws.on("message", (data) => {
      const response = JSON.parse(data.toString());
      if (response.method === "userIntentSolutionsFeed") {
        this.collectedSolutions.push(response.params);
      }
      console.log("WebSocket message received:", data.toString());
    });

    this.ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    this.ws.on("close", () => {
      console.log("WebSocket connection closed.");
    });
  }

  private subscribeToSolutions(): void {
    const { createSign } = crypto;

    const hash = crypto.createHash('keccak256').update(Buffer.from(this.dappAddress)).digest();
  
    const sign = createSign('SHA256');
    sign.update(hash);
    sign.end();
    const privateKeyHex = "YOUR_PRIVATE_KEY_HEX"; // Replace with the actual private key
    const signature = sign.sign(privateKeyHex, 'hex');
  
    const m = {
      dapp_address: this.dappAddress,
      hash: hash.toString('hex'),
      signature: signature
    };
  
    const req = JSON.stringify({
      id: '2',
      method: 'subscribe',
      params: ['userIntentSolutionsFeed', m]
    });
  
    this.ws.send(req, (err) => {
      if (err) {
        console.error('Failed to subscribe to solutions:', err);
      }
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
    return new Promise((resolve, reject) => {
        const req = genSubmitIntent(userOp);
  
        this.ws.send(req, (err) => {
          if (err) {
            return reject(err);
          }
  
          this.ws.on("message", (data) => {
            const response = JSON.parse(data.toString());
            if (response.error) {
              reject(response.error.message);
            } else {
              resolve(response.result);
            }
          });
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
    return new Promise((resolve) => {
      const filteredSolutions = this.collectedSolutions.filter(
        (solution) => solution.intentId === userOpHash
      );

      const parsedSolutions = filteredSolutions.map((solution) => {
        const intentSolutionJson = Buffer.from(solution.intentSolution, 'base64').toString('utf-8');
        const intentSolution = JSON.parse(intentSolutionJson);
        return OperationBuilder.newSolverOperation(intentSolution);
      });

      resolve(parsedSolutions);
    });
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

function genSubmitIntent(userOp: UserOperation): string {
    const intent = Buffer.from(JSON.stringify(userOp.toStruct()));
  
    const m = {
      dapp_address: userOp.getField("dapp"),
      sender_address: userOp.getField("from"),
      intent: intent.toString("hex"),
      hash: "0x0",
      signature: userOp.getField("signature"),
    };
  
    const req = JSON.stringify({
      id: "1",
      method: "blxr_submit_intent",
      params: m,
    });

    return req;
}