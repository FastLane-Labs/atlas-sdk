import {
  Eip1193Provider,
  Wallet,
  HDNodeWallet,
  Interface,
} from "ethers";
import { BProvider } from "./bProvider";
import { OperationBuilder } from "./operationBuilder";
import { OperationsRelay } from "./operationRelay";
import { Sorter } from "./sorter";
import { DApp } from "./dApp";
import {
  UserOperation,
  UserOperationParams,
  SolverOperation,
  DAppOperation,
} from "./operation";
import atlasAbi from "./abi/Atlas.json";

/**
 * The main class to submit user operations to Atlas.
 */
export class AtlasSDK {
  private provider: BProvider;
  private iAtlas: Interface;
  private operationRelay: OperationsRelay;
  private operationBuilder: OperationBuilder;
  private sorter: Sorter;
  private dApp: DApp;
  private sessionKeys: Map<string, HDNodeWallet> = new Map();

  /**
   * Creates a new Atlas SDK instance.
   * @param relayApiEndpoint the url of the operation relay's API
   * @param provider a provider
   * @param chainId the chain ID of the network
   */
  constructor(
    relayApiEndpoint: string,
    provider: Eip1193Provider,
    chainId: number
  ) {
    this.provider = new BProvider(provider, chainId);
    this.iAtlas = new Interface(atlasAbi);
    this.operationRelay = new OperationsRelay(relayApiEndpoint);
    this.operationBuilder = new OperationBuilder(this.provider, chainId);
    this.sorter = new Sorter(this.provider, chainId);
    this.dApp = new DApp(this.provider, chainId);
  }

  /**
   * Builds a user operation without the 'sessionKey' and 'signature' fields.
   * @param userOperationParams the parameters to build the user operation
   * @returns an unsigned user operation
   */
  public async buildUserOperation(
    userOperationParams: UserOperationParams
  ): Promise<UserOperation> {
    const userOp = await this.operationBuilder.buildUserOperation(
      userOperationParams
    );
    OperationBuilder.validateUserOperation(userOp, false, false);
    return userOp;
  }

  /**
   * Generates a unique session key for this user operation.
   * @param userOp a user operation
   * @returns the user operation with a valid sessionKey field
   */
  public generateSessionKey(userOp: UserOperation): UserOperation {
    const sessionAccount = Wallet.createRandom();
    userOp.sessionKey = sessionAccount.address;
    OperationBuilder.validateUserOperation(userOp, true, false);
    this.sessionKeys.set(sessionAccount.address, sessionAccount);
    return userOp;
  }

  /**
   * Prompt the user to sign their operation.
   * @param userOp a user operation
   * @returns the user operation with a valid signature field
   */
  public async signUserOperation(
    userOp: UserOperation
  ): Promise<UserOperation> {
    OperationBuilder.validateUserOperation(userOp, true, false);

    userOp.signature = await this.provider.send("eth_signTypedData_v4", [
      userOp.from,
      JSON.stringify(userOp),
    ]);

    OperationBuilder.validateUserOperation(userOp);
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
    OperationBuilder.validateUserOperation(userOp);

    if (!this.sessionKeys.has(userOp.sessionKey)) {
      throw new Error("Session key not found");
    }

    // Submit the user operation to the relay
    const solverOps: SolverOperation[] =
      await this.operationRelay.submitUserOperation(userOp);
    console.log("returned data", solverOps);
    if (solverOps.length === 0) {
      throw new Error(
        "No solver operations were returned by the operation relay"
      );
    }

    OperationBuilder.validateSolverOperations(solverOps);
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
    OperationBuilder.validateUserOperation(userOp);
    OperationBuilder.validateSolverOperations(solverOps);

    const sortedSolverOps = await this.sorter.sortSolverOperations(
      userOp,
      solverOps
    );

    if (sortedSolverOps.length === 0) {
      throw new Error(
        "No valid solver operations were returned by the Atlas sorter"
      );
    }

    OperationBuilder.validateSolverOperations(sortedSolverOps);
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
    OperationBuilder.validateUserOperation(userOp);
    OperationBuilder.validateSolverOperations(solverOps);

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

    OperationBuilder.validateDAppOperation(dAppOp);
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
    OperationBuilder.validateUserOperation(userOp);
    OperationBuilder.validateSolverOperations(solverOps);
    OperationBuilder.validateDAppOperation(dAppOp);

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
    OperationBuilder.validateUserOperation(userOp);
    OperationBuilder.validateSolverOperations(solverOps);
    OperationBuilder.validateDAppOperation(dAppOp);

    if (userOp.sessionKey !== dAppOp.from) {
      throw new Error(
        "User operation session key does not match dApp operation"
      );
    }

    const atlasTxHash: string = await this.operationRelay.submitAllOperations({
      userOperation: userOp,
      solverOperations: solverOps,
      dAppOperation: dAppOp,
    });

    return atlasTxHash;
  }

  /**
   * Creates an Atlas transaction.
   * @param userOperationParams the parameters to build the user operation
   * @param isBundlerLocal a boolean indicating if the bundler is local
   * @returns the encoded calldata for metacall if isBundlerLocal is true,
   * the hash of the resulting Atlas transaction otherwise
   */
  public async createAtlasTransaction(
    userOperationParams: UserOperationParams,
    isBundlerLocal: boolean = false
  ): Promise<string> {
    // Build the user operation
    let userOp: UserOperation = await this.buildUserOperation(
      userOperationParams
    );

    // Generate a unique session key for this user operation
    userOp = this.generateSessionKey(userOp);

    // Prompt the user to sign their operation
    userOp = await this.signUserOperation(userOp);

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
      return this.getMetacallCalldata(userOp, sortedSolverOps, dAppOp);
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
