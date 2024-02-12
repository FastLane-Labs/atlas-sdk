import { ExternalProvider, Web3Provider } from "@ethersproject/providers";
import { isAddress } from "@ethersproject/address";
import { Wallet } from "ethers";
import { Interface } from "ethers/lib/utils";
import { OperationBuilder } from "./operationBuilder";
import { OperationRelay } from "./operationRelay";
import { Sorter } from "./sorter";
import { DApp } from "./dApp";
import { UserOperation, SolverOperation, DAppOperation } from "./operation";
import atlasAbi from "./abi/Atlas.json";

/**
 * The main class to submit user operations to Atlas.
 */
export class AtlasSDK extends OperationBuilder {
  private iAtlas: Interface;
  private operationRelay: OperationRelay;
  private sorter: Sorter;
  private dApp: DApp;
  private sessionKeys: Map<string, Wallet> = new Map();

  /**
   * Creates a new Atlas SDK instance.
   * @param relayApiEndpoint the url of the operation relay's API
   * @param provider a provider
   * @param chainId the chain ID of the network
   */
  constructor(
    relayApiEndpoint: string,
    provider: ExternalProvider,
    chainId: number
  ) {
    const web3Provider = new Web3Provider(provider, chainId);

    super(web3Provider, chainId);
    this.iAtlas = new Interface(atlasAbi);
    this.operationRelay = new OperationRelay(relayApiEndpoint);
    this.sorter = new Sorter(web3Provider, chainId);
    this.dApp = new DApp(web3Provider, chainId);
  }

  /**
   * Generates a unique session key for this user operation.
   * @param userOp a user operation
   * @returns the user operation with a valid sessionKey field
   */
  public generateSessionKey(userOp: UserOperation): UserOperation {
    const sessionAccount: Wallet = Wallet.createRandom();
    userOp.sessionKey = sessionAccount.address;
    this.sessionKeys.set(sessionAccount.address, sessionAccount);
    return userOp;
  }

  /**
   * Submits a user operation to the operation relay.
   * @param userOp a signed user operation
   * @returns an array of solver operations
   */
  public async submitUserOperation(
    userOp: UserOperation
  ): Promise<SolverOperation[]> {
    if (!isAddress(userOp.sessionKey)) {
      throw new Error("User operation has an invalid session key");
    }

    if (!this.sessionKeys.has(userOp.sessionKey)) {
      throw new Error("Session key not found");
    }

    // Submit the user operation to the relay
    const solverOps: SolverOperation[] =
      await this.operationRelay.submitUserOperation(userOp);
    if (solverOps.length === 0) {
      throw new Error(
        "No solver operations were returned by the operation relay"
      );
    }

    return solverOps;
  }

  /**
   * Sorts solver operations and filter out invalid ones.
   * @param solverOps an array of solver operations
   * @returns a sorted/filtered array of solver operations
   */
  public async sortSolverOperations(
    userOp: UserOperation,
    solverOps: SolverOperation[]
  ): Promise<SolverOperation[]> {
    const sortedSolverOps = await this.sorter.sortSolverOperations(
      userOp,
      solverOps
    );

    if (sortedSolverOps.length === 0) {
      throw new Error(
        "No valid solver operations were returned by the Atlas sorter"
      );
    }

    return sortedSolverOps;
  }

  /**
   * Creates a valid dApp operation.
   * @param userOp a signed user operation
   * @param solverOps an array of solver operations
   * @returns a valid dApp operation
   */
  public async createDAppOperation(
    userOp: UserOperation,
    solverOps: SolverOperation[]
  ): Promise<DAppOperation> {
    if (!userOp.sessionKey) {
      throw new Error("User operation is missing a session key");
    }

    const sessionAccount = this.sessionKeys.get(userOp.sessionKey);
    if (!sessionAccount) {
      throw new Error("Session key not found");
    }

    // Only keep the local copy for the rest of the process
    this.sessionKeys.delete(userOp.sessionKey);

    if (userOp.sessionKey !== sessionAccount.address) {
      throw new Error("User operation session key does not match");
    }

    const dAppOp: DAppOperation = await this.dApp.createDAppOperation(
      userOp,
      solverOps,
      sessionAccount
    );

    return dAppOp;
  }

  /**
   * Gets metacall's encoded calldata.
   * @param userOp a signed user operation
   * @param solverOps an array of solver operations
   * @param dAppOp a signed dApp operation
   * @returns the encoded calldata for metacall
   */
  public getMetacallCalldata(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    dAppOp: DAppOperation
  ): string {
    return this.iAtlas.encodeFunctionData("metacall", [
      userOp,
      solverOps,
      dAppOp,
    ]);
  }

  /**
   * Submits all operations to the operations relay for bundling.
   * @param userOp a signed user operation
   * @param solverOps an array of solver operations
   * @param dAppOp a signed dApp operation
   * @returns the hash of the generated Atlas transaction
   */
  public async submitAllOperations(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    dAppOp: DAppOperation
  ): Promise<string> {
    if (userOp.sessionKey !== dAppOp.from) {
      throw new Error(
        "User operation session key does not match dApp operation"
      );
    }

    const atlasTxHash: string = await this.operationRelay.submitAllOperations(
      userOp,
      solverOps,
      dAppOp
    );

    return atlasTxHash;
  }

  /**
   * Creates an Atlas transaction from a user operation.
   * @param userOp a signed user operation
   * @param isBundlerLocal a boolean indicating if the bundler is local
   * @returns the encoded calldata for metacall if isBundlerLocal is true,
   * the hash of the resulting Atlas transaction otherwise
   */
  public async createAtlasTransaction(
    userOp: UserOperation,
    isBundlerLocal: boolean = false
  ): Promise<string> {
    // Submit the user operation to the relay
    const solverOps: SolverOperation[] = await this.submitUserOperation(userOp);

    // Sort bids and filter out invalid solver operations
    const sortedSolverOps = await this.sortSolverOperations(userOp, solverOps);

    // Create the dApp operation, signed with the session key
    const dAppOp: DAppOperation = await this.createDAppOperation(
      userOp,
      sortedSolverOps
    );

    if (isBundlerLocal) {
      // Return metacall's calldata only, for local bundling
      return this.iAtlas.encodeFunctionData("metacall", [
        userOp,
        sortedSolverOps,
        dAppOp,
      ]);
    }

    // Submit all operations to the relay for bundling
    const atlasTxHash: string = await this.submitAllOperations(
      userOp,
      sortedSolverOps,
      dAppOp
    );

    return atlasTxHash;
  }
}
