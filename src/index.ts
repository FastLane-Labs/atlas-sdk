import {
  AbstractProvider,
  Wallet,
  HDNodeWallet,
  Interface,
  AbstractSigner,
  ZeroAddress,
  Contract,
} from "ethers";
import { UserOperationParams, OperationBuilder, ZeroBytes } from "./operation";
import { OperationsRelay } from "./relay";
import { UserOperation, SolverOperation, DAppOperation } from "./operation";
import {
  validateAddress,
  flagUserNoncesSequenced,
  flagZeroSolvers,
  flagRequirePreOps,
  flagExPostBids,
} from "./utils";
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
   * Creates a new user operation.
   * @param userOpParams The user operation parameters
   * @param generateSessionKey Generate a session key for this user operation
   * @returns The user operation and the call configuration for the target dApp
   */
  public async newUserOperation(
    userOpParams: UserOperationParams,
    generateSessionKey = false
  ): Promise<[UserOperation, number]> {
    let userOp = OperationBuilder.newUserOperation({
      from: userOpParams.from,
      to: userOpParams.to
        ? userOpParams.to
        : chainConfig[this.chainId].contracts.atlas.address,
      value: userOpParams.value,
      gas: userOpParams.gas,
      maxFeePerGas: userOpParams.maxFeePerGas,
      nonce: userOpParams.nonce,
      deadline: userOpParams.deadline,
      dapp: userOpParams.dapp,
      control: userOpParams.control,
      sessionKey: userOpParams.sessionKey,
      data: userOpParams.data,
      signature: userOpParams.signature,
    });

    const dConfig = await this.dAppControl
      .attach(userOpParams.control)
      .getFunction("getDAppConfig")
      .staticCall(userOp.toStruct());

    if (dConfig.to !== userOpParams.control) {
      throw new Error("UserOperation control does not match dApp control");
    }

    if (!userOpParams.nonce) {
      userOp = await this.setUserOperationNonce(userOp, dConfig.callConfig);
    }

    if (generateSessionKey) {
      userOp = this.generateSessionKey(userOp);
    }

    return [userOp, dConfig.callConfig];
  }

  /**
   * Sets the user operation's nonce.
   * @param userOp a user operation
   * @param callConfig the dApp call configuration
   * @returns the user operation with a valid nonce field
   */
  public async setUserOperationNonce(
    userOp: UserOperation,
    callConfig: number
  ): Promise<UserOperation> {
    const nonce: bigint = await this.atlasVerification.getNextNonce(
      userOp.getField("from").value as string,
      flagUserNoncesSequenced(callConfig)
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
    userOp.setField(
      "signature",
      await signer.signTypedData(
        chainConfig[this.chainId].eip712Domain,
        userOp.toTypedDataTypes(),
        userOp.toTypedDataValues()
      )
    );
    userOp.validateSignature(chainConfig[this.chainId].eip712Domain);
    return userOp;
  }

  /**
   * Submits a user operation to the operation relay.
   * @param userOp a signed user operation
   * @param callConfig the dApp call configuration
   * @param hints an array of addresses used as hints for solvers
   * @returns an array of solver operations
   */
  public async submitUserOperation(
    userOp: UserOperation,
    callConfig: number,
    hints: string[] = []
  ): Promise<[string, SolverOperation[]]> {
    if (!this.sessionKeys.has(userOp.getField("sessionKey").value as string)) {
      throw new Error("Session key not found");
    }

    userOp.validateFields();

    // Check the signature only if it's already set
    if (userOp.getField("signature").value !== ZeroBytes) {
      userOp.validateSignature(chainConfig[this.chainId].eip712Domain);
    }

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

    if (solverOps.length === 0 && !flagZeroSolvers(callConfig)) {
      throw new Error("No solver operations returned");
    }

    return [userOphash, solverOps];
  }

  /**
   * Sorts solver operations and filter out invalid ones.
   * @param userOp a user operation
   * @param solverOps an array of solver operations
   * @param callConfig the dApp call configuration
   * @returns a sorted/filtered array of solver operations
   */
  public async sortSolverOperations(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    callConfig: number
  ): Promise<SolverOperation[]> {
    if (flagExPostBids(callConfig)) {
      // Sorting will be done onchain during execution
      return solverOps;
    }

    const sortedSolverOps: SolverOperation[] = await this.sorter.sortBids(
      userOp.toStruct(),
      solverOps.map((solverOp) => solverOp.toStruct())
    );

    if (sortedSolverOps.length === 0 && !flagZeroSolvers(callConfig)) {
      throw new Error("No solver operations returned");
    }

    return sortedSolverOps;
  }

  /**
   * Creates a valid dApp operation.
   * @param userOp a user operation
   * @param solverOps an array of solver operations
   * @param callConfig the dApp call configuration
   * @returns a valid dApp operation
   */
  public async createDAppOperation(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    callConfig: number
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

    const dAppOp: DAppOperation =
      OperationBuilder.newDAppOperationFromUserSolvers(
        userOp,
        solverOps,
        sessionAccount,
        flagRequirePreOps(callConfig)
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
   * Creates an Atlas transaction from end to end.
   * @param signer the signer to sign the user operation
   * @param userOpParams the user operation parameters
   * @param generateSessionKey a boolean indicating if a session key should be generated
   * @param hints an array of addresses used as hints for solvers
   * @param isBundlerLocal a boolean indicating if the bundler is local
   * @returns the encoded calldata for metacall if isBundlerLocal is true,
   * the hash of the resulting Atlas transaction otherwise
   */
  public async createAtlasTransaction(
    signer: AbstractSigner,
    userOpParams: UserOperationParams,
    generateSessionKey: boolean = false,
    hints: string[] = [],
    isBundlerLocal: boolean = false
  ): Promise<string> {
    // Build the user operation, set the nonce if it's not provided, generate a session key if instructed to
    let [userOp, callConfig] = await this.newUserOperation(
      userOpParams,
      generateSessionKey
    );

    // Prompt the user to sign their operation
    userOp = await this.signUserOperation(userOp, signer);

    // Submit the user operation to the relay
    let userOpHash: string;
    let solverOps: SolverOperation[];
    [userOpHash, solverOps] = await this.submitUserOperation(
      userOp,
      callConfig,
      hints
    );

    // Sort bids and filter out invalid solver operations
    const sortedSolverOps = await this.sortSolverOperations(
      userOp,
      solverOps,
      callConfig
    );

    // Create the dApp operation, signed with the session key
    const dAppOp: DAppOperation = await this.createDAppOperation(
      userOp,
      sortedSolverOps,
      callConfig
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
