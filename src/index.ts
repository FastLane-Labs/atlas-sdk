import { Web3Provider } from "@ethersproject/providers";
import { Wallet } from "ethers";
import { OperationRelay } from "./operationRelay";
import { Sorter } from "./sorter";
import { DApp } from "./dApp";
import { UserOperation, SolverOperation, DAppOperation } from "./operation";

/**
 * The main class to submit user operations to Atlas.
 */
export default class AtlasSDK {
  operationRelay: OperationRelay;
  sorter: Sorter;
  dApp: DApp;
  sessionKeys: Map<string, Wallet> = new Map();

  /**
   * Creates a new Atlas SDK instance.
   * @param relayApiEndpoint the url of the operation relay's API
   * @param provider a Web3 provider
   * @param chainId the chain ID of the network
   */
  constructor(
    relayApiEndpoint: string,
    provider: Web3Provider,
    chainId: number
  ) {
    this.operationRelay = new OperationRelay(relayApiEndpoint);
    this.sorter = new Sorter(provider, chainId);
    this.dApp = new DApp(provider, chainId);
  }

  /**
   * Generates a unique session key for this user operation.
   * @param userOp a user operation
   * @returns the user operation with a valid sessionKey field
   */
  public generateSessionKey(userOp: UserOperation): UserOperation {
    const sessionAccount: Wallet = Wallet.createRandom();
    userOp.sessionKey = sessionAccount.publicKey;
    this.sessionKeys.set(sessionAccount.publicKey, sessionAccount);
    return userOp;
  }

  /**
   * Creates an Atlas transaction from a user operation.
   * @param userOp a signed user operation
   * @returns the hash of the resulting Atlas transaction
   */
  public async createAtlasTransaction(userOp: UserOperation): Promise<string> {
    if (!userOp.sessionKey) {
      throw new Error("User operation does not have a session key");
    }

    // Get the session key for this user operation
    const sessionAccount = this.sessionKeys.get(userOp.sessionKey);
    if (!sessionAccount) {
      throw new Error("Session key not found");
    }

    // Only keep the local copy for the rest of the process
    this.sessionKeys.delete(userOp.sessionKey);

    // Submit the user operation to the relay
    const solverOps: SolverOperation[] =
      await this.operationRelay.submitUserOperation(userOp);
    if (solverOps.length === 0) {
      throw new Error(
        "No solver operations were returned by the operation relay"
      );
    }

    // Sort bids and filter out invalid solver operations
    const sortedSolverOps = await this.sorter.sortSolverOperations(
      userOp,
      solverOps
    );
    if (sortedSolverOps.length === 0) {
      throw new Error(
        "No valid solver operations were returned by the Atlas sorter"
      );
    }

    // Create the dApp operation, signed with the session key
    const dAppOp: DAppOperation = await this.dApp.createDAppOperation(
      userOp,
      sortedSolverOps,
      sessionAccount
    );

    // Submit all operations to the relay
    const atlasTxHash: string = await this.operationRelay.submitAllOperations(
      userOp,
      sortedSolverOps,
      dAppOp
    );

    return atlasTxHash;
  }
}
