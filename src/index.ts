import {
  AbstractProvider,
  Wallet,
  HDNodeWallet,
  Interface,
  AbstractSigner,
  ZeroAddress,
  Contract,
} from "ethers";
import { OperationBuilder } from "./operation";
import { OperationsRelay } from "./relay";
import { UserOperation, SolverOperation, DAppOperation } from "./operation";
import { validateAddress } from "./utils";
import { chainConfig } from "./config";
import atlasAbi from "./abi/Atlas.json";
import atlasVerificationAbi from "./abi/AtlasVerification.json";
import dAppControlAbi from "./abi/DAppControl.json";
import sorterAbi from "./abi/Sorter.json";

/**
 * The main class to submit user operations to Atlas.
 */
export class Atlas {
  private iAtlas: Interface;
  private atlasVerification: Contract;
  private dAppControl: Contract;
  private sorter: Contract;
  private operationsRelay: OperationsRelay;
  private sessionKeys: Map<string, HDNodeWallet> = new Map();
  private chainId: number;

  /**
   * Creates a new Atlas SDK instance.
   * @param relayApiEndpoint the url of the operation relay's API
   * @param provider a provider
   * @param chainId the chain ID of the network
   */
  constructor(
    relayApiEndpoint: string,
    provider: AbstractProvider,
    chainId: number
  ) {
    this.chainId = chainId;
    this.iAtlas = new Interface(atlasAbi);
    this.atlasVerification = new Contract(
      chainConfig[chainId].contracts.atlasVerification.address,
      atlasVerificationAbi,
      provider
    );
    this.dAppControl = new Contract(ZeroAddress, dAppControlAbi, provider);
    this.sorter = new Contract(
      chainConfig[chainId].contracts.sorter.address,
      sorterAbi,
      provider
    );
    this.operationsRelay = new OperationsRelay(relayApiEndpoint);
  }

  /**
   * Sets the user operation's nonce.
   * @param userOp a user operation
   * @returns the user operation with a valid nonce field
   */
  public async setUserOperationNonce(
    userOp: UserOperation
  ): Promise<UserOperation> {
    const requireSequencedUserNonces = await this.dAppControl
      .attach(userOp.getField("control").value as string)
      .getFunction("requireSequencedUserNonces")
      .staticCall();

    const nonce: bigint = await this.atlasVerification.getNextNonce(
      userOp.getField("from").value as string,
      requireSequencedUserNonces
    );

    userOp.setField("nonce", nonce);
    return userOp;
  }

  /**
   * Generates a unique session key for this user operation.
   * @param userOp a user operation
   * @returns the user operation with a valid sessionKey field
   */
  public generateSessionKey(userOp: UserOperation): UserOperation {
    const sessionAccount = Wallet.createRandom();
    userOp.setField("sessionKey", sessionAccount.address);
    this.sessionKeys.set(sessionAccount.address, sessionAccount);
    return userOp;
  }

  /**
   * Prompt the user to sign their operation.
   * @param userOp a user operation
   * @returns the user operation with a valid signature field
   */
  public async signUserOperation(
    userOp: UserOperation,
    signer: AbstractSigner
  ): Promise<UserOperation> {
    // TODO: we need to have the user wallet popup here

    // userOp.setField(
    //   "signature",
    //   await this.provider.send("eth_signTypedData_v4", [
    //     signer,
    //     JSON.stringify(userOp.toTypedDataValues()),
    //   ])
    // );

    userOp.validateSignature(chainConfig[this.chainId].eip712Domain);
    return userOp;
  }

  /**
   * Submits a user operation to the operation relay.
   * @param userOp a signed user operation
   * @param hints an array of addresses used as hints for solvers
   * @returns an array of solver operations
   */
  public async submitUserOperation(
    userOp: UserOperation,
    hints: string[] = []
  ): Promise<[string, SolverOperation[]]> {
    if (!this.sessionKeys.has(userOp.getField("sessionKey").value as string)) {
      throw new Error("Session key not found");
    }

    userOp.validate(chainConfig[this.chainId].eip712Domain);
    for (const hint of hints) {
      if (!validateAddress(hint)) {
        throw new Error(`Invalid hint address: ${hint}`);
      }
    }

    // Submit the user operation to the relay
    const userOphash: string = await this.operationsRelay.submitUserOperation(
      userOp,
      hints
    );

    // Get the solver operations
    const solverOps: SolverOperation[] =
      await this.operationsRelay.getSolverOperations(userOphash, true);

    // TODO: validate that the dApp allows 0 solvers if none was returned

    return [userOphash, solverOps];
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
    const sortedSolverOps: SolverOperation[] = await this.sorter.sortBids(
      userOp.toStruct(),
      solverOps.map((solverOp) => solverOp.toStruct())
    );

    // TODO: validate that the dApp allows 0 solvers if none was returned

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
    const sessionKey = userOp.getField("sessionKey").value as string;

    const sessionAccount = this.sessionKeys.get(sessionKey);
    if (!sessionAccount) {
      throw new Error("Session key not found");
    }

    // Only keep the local copy for the rest of the process
    this.sessionKeys.delete(sessionKey);

    if (sessionKey !== sessionAccount.address) {
      throw new Error("User operation session key does not match");
    }

    const dConfig = await this.dAppControl
      .attach(userOp.getField("control").value as string)
      .getFunction("getDAppConfig")
      .staticCall(userOp.toStruct());

    const dAppOp: DAppOperation =
      OperationBuilder.newDAppOperationFromUserSolvers(
        userOp,
        solverOps,
        sessionAccount,
        dConfig.callConfig,
        dConfig.to,
        this.chainId
      );

    const signature = await sessionAccount.signTypedData(
      chainConfig[this.chainId].eip712Domain,
      dAppOp.toTypedDataTypes(),
      dAppOp.toTypedDataValues()
    );

    dAppOp.setField("signature", signature);
    dAppOp.validateSignature(chainConfig[this.chainId].eip712Domain);

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
      userOp.toStruct(),
      solverOps.map((solverOp) => solverOp.toStruct()),
      dAppOp.toStruct(),
    ]);
  }

  /**
   * Submits all operations to the operations relay for bundling.
   * @param userOp a signed user operation
   * @param solverOps an array of solver operations
   * @param dAppOp a signed dApp operation
   * @param userOpHash the hash of the user operation
   * @returns the hash of the generated Atlas transaction
   */
  public async submitBundle(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    dAppOp: DAppOperation,
    userOpHash: string
  ): Promise<string> {
    if (userOp.getField("sessionKey").value !== dAppOp.getField("from").value) {
      throw new Error(
        "User operation session key does not match dApp operation"
      );
    }

    const bundle = OperationBuilder.newBundle(userOp, solverOps, dAppOp);
    bundle.validate(chainConfig[this.chainId].eip712Domain);

    await this.operationsRelay.submitBundle(bundle);

    const atlasTxHash: string = await this.operationsRelay.getBundleHash(
      userOpHash,
      true
    );

    return atlasTxHash;
  }

  /**
   * Creates an Atlas transaction.
   * @param signer the signer to sign the user operation
   * @param userOp the user operation (without nonce, sessionKey, signature)
   * @param hints an array of addresses used as hints for solvers
   * @param isBundlerLocal a boolean indicating if the bundler is local
   * @returns the encoded calldata for metacall if isBundlerLocal is true,
   * the hash of the resulting Atlas transaction otherwise
   */
  public async createAtlasTransaction(
    signer: AbstractSigner,
    userOp: UserOperation,
    hints: string[] = [],
    isBundlerLocal: boolean = false
  ): Promise<string> {
    // Set the user operation nonce
    userOp = await this.setUserOperationNonce(userOp);

    // Generate a unique session key for this user operation
    userOp = this.generateSessionKey(userOp);

    // Prompt the user to sign their operation
    userOp = await this.signUserOperation(userOp, signer);

    // Submit the user operation to the relay
    let userOpHash: string;
    let solverOps: SolverOperation[];
    [userOpHash, solverOps] = await this.submitUserOperation(userOp, hints);

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
    const atlasTxHash: string = await this.submitBundle(
      userOp,
      sortedSolverOps,
      dAppOp,
      userOpHash
    );

    return atlasTxHash;
  }
}
