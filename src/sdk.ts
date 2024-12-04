import {
  AbstractProvider,
  Wallet,
  HDNodeWallet,
  Interface,
  AbstractSigner,
  ZeroAddress,
  Contract,
} from "ethers";
import {
  UserOperation,
  SolverOperation,
  DAppOperation,
  UserOperationParams,
  OperationBuilder,
  ZeroBytes,
  Bundle,
} from "./operation";
import { IBackend } from "./backend";
import {
  IHooksController,
  IHooksControllerConstructable,
} from "./backend/hooks";
import {
  validateAddress,
  flagUserNoncesSequential,
  flagZeroSolvers,
  flagExPostBids,
  flagTrustedOpHash,
} from "./utils";
import { AtlasVersion, AtlasLatestVersion, chainConfig, atlasAbi, atlasVerificationAbi, sorterAbi } from "./config";
import dAppControlAbi from "./abi/DAppControl.json";

/**
 * The main class to submit user operations to Atlas.
 */
export class AtlasSdk {
  private chainId: number;
  private atlasVersion: AtlasVersion;
  private iAtlas: Interface;
  private atlasVerification: Contract;
  private dAppControl: Contract;
  private sorter: Contract;
  private backend: IBackend;
  private sessionKeys: Map<string, HDNodeWallet> = new Map();
  private usersLastNonSequentialNonce: Map<string, bigint> = new Map();

  /**
   * Creates a new Atlas SDK instance.
   * @param provider a provider
   * @param chainId the chain ID of the network
   * @param backend a backend client
   * @param hooksControllers an array of hooks controllers
   * @param atlasVersion the version of the Atlas protocol
   */
  public static async create(
    provider: AbstractProvider,
    chainId: number,
    backend: IBackend,
    hooksControllers: IHooksControllerConstructable[] = [],
    atlasVersion: AtlasVersion = AtlasLatestVersion,
  ): Promise<AtlasSdk> {
    const atlasVerificationContract = new Contract(
      (await chainConfig(chainId, atlasVersion)).contracts.atlasVerification,
      atlasVerificationAbi(atlasVersion),
      provider,
    );
    const sorterContract = new Contract(
      (await chainConfig(chainId, atlasVersion)).contracts.sorter,
      sorterAbi(atlasVersion),
      provider,
    );
    return new AtlasSdk(provider, chainId, atlasVersion, backend, atlasVerificationContract, sorterContract, hooksControllers);
  }

  /**
   * Creates a new Atlas SDK instance.
   * @param provider a provider
   * @param chainId the chain ID of the network
   * @param atlasVersion the version of the Atlas protocol
   * @param backend a backend client
   * @param atlasVerificationContract the Atlas verification contract
   * @param sorterContract the sorter contract
   * @param hooksControllers an array of hooks controllers
   */
  private constructor(
    provider: AbstractProvider,
    chainId: number,
    atlasVersion: AtlasVersion,
    backend: IBackend,
    atlasVerificationContract: Contract,
    sorterContract: Contract,
    hooksControllers: IHooksControllerConstructable[] = [],
  ) {
    this.chainId = chainId;
    this.atlasVersion = atlasVersion;
    this.iAtlas = new Interface(atlasAbi(atlasVersion));
    this.atlasVerification = atlasVerificationContract;
    this.dAppControl = new Contract(ZeroAddress, dAppControlAbi, provider);
    this.sorter = sorterContract;
    const _hooksControllers = hooksControllers.map(
      (HookController) => new HookController(provider),
    );
    this.backend = backend;
    this.backend.addHooksControllers(_hooksControllers);
  }

  /**
   * Creates a new user operation.
   * @param userOpParams The user operation parameters
   * @param generateSessionKey Generate a session key for this user operation
   * @returns The user operation
   */
  public async newUserOperation(
    userOpParams: UserOperationParams,
    generateSessionKey = false,
  ): Promise<UserOperation> {
    let userOp = OperationBuilder.newUserOperation({
      from: userOpParams.from,
      to: userOpParams.to
        ? userOpParams.to
        : (await chainConfig(this.chainId, this.atlasVersion)).contracts.atlas,
      value: userOpParams.value,
      gas: userOpParams.gas,
      maxFeePerGas: userOpParams.maxFeePerGas,
      nonce: userOpParams.nonce,
      deadline: userOpParams.deadline,
      dapp: userOpParams.dapp,
      control: userOpParams.control,
      callConfig: userOpParams.callConfig,
      sessionKey: userOpParams.sessionKey,
      data: userOpParams.data,
      signature: userOpParams.signature,
    });

    const dConfig = await this.dAppControl
      .attach(userOpParams.control)
      .getFunction("getDAppConfig")
      .staticCall(userOp.toStruct());

    if (!userOpParams.callConfig) {
      userOp.setField("callConfig", dConfig.callConfig);
    } else if (dConfig.callConfig !== userOpParams.callConfig) {
      throw new Error(
        "UserOperation callConfig does not match dApp callConfig",
      );
    }

    if (dConfig.to !== userOpParams.control) {
      throw new Error("UserOperation control does not match dApp control");
    }

    if (!userOpParams.nonce) {
      userOp = await this.setUserOperationNonce(userOp);
    }

    if (generateSessionKey) {
      userOp = this.generateSessionKey(userOp);
    }

    return userOp;
  }

  /**
   * Gets the hash of a user operation.
   * @param userOp a user operation
   * @returns the hash of the user operation
   */
  public async getUserOperationHash(userOp: UserOperation): Promise<string> {
    const eip712Domain = (await chainConfig(this.chainId, this.atlasVersion)).eip712Domain;
    return userOp.hash(
      eip712Domain,
      flagTrustedOpHash(userOp.callConfig()),
    );
  }

  /**
   * Sets the user operation's nonce.
   * @param userOp a user operation
   * @returns the user operation with a valid nonce field
   */
  public async setUserOperationNonce(
    userOp: UserOperation,
  ): Promise<UserOperation> {
    const user = userOp.getField("from").value as string;
    let nonce: bigint;

    if (flagUserNoncesSequential(userOp.callConfig())) {
      nonce = await this.atlasVerification.getUserNextNonce(user, true);
    } else {
      if (this.usersLastNonSequentialNonce.has(user)) {
        nonce = await this.atlasVerification.getUserNextNonSeqNonceAfter(
          user,
          this.usersLastNonSequentialNonce.get(user) as bigint,
        );
      } else {
        nonce = await this.atlasVerification.getUserNextNonce(user, false);
      }
      this.usersLastNonSequentialNonce.set(user, nonce);
    }

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
   * @param signer a signer
   * @returns the user operation with a valid signature field
   */
  public async signUserOperation(
    userOp: UserOperation,
    signer: AbstractSigner,
  ): Promise<UserOperation> {
    const eip712Domain = (await chainConfig(this.chainId, this.atlasVersion)).eip712Domain;
    userOp.setField(
      "signature",
      await signer.signTypedData(
        eip712Domain,
        userOp.toTypedDataTypes(),
        userOp.toTypedDataValues(),
      ),
    );
    userOp.validateSignature(eip712Domain);
    return userOp;
  }

  /**
   * Submits a user operation to the backend.
   * @param userOp a signed user operation
   * @param hints an array of addresses used as hints for solvers
   * @returns an array of solver operations
   */
  public async submitUserOperation(
    userOp: UserOperation,
    hints: string[] = [],
    options: any = {},
  ): Promise<string[] | Bundle> {
    const sessionKey = userOp.getField("sessionKey").value as string;
    if (sessionKey !== ZeroAddress && !this.sessionKeys.has(sessionKey)) {
      throw new Error("Session key not found");
    }

    userOp.validateFields();

    // Check the signature only if it's already set
    if (userOp.getField("signature").value !== ZeroBytes) {
      const eip712Domain = (await chainConfig(this.chainId, this.atlasVersion)).eip712Domain;
      userOp.validateSignature(eip712Domain);
    }

    for (const hint of hints) {
      if (!validateAddress(hint)) {
        throw new Error(`Invalid hint address: ${hint}`);
      }
    }

    // Submit the user operation to the backend
    const result = await this.backend.submitUserOperation(
      this.chainId,
      this.atlasVersion,
      userOp,
      hints,
      options,
    );

    return result;
  }

  /**
   * Sorts solver operations and filter out invalid ones.
   * @param userOp a user operation
   * @param solverOps an array of solver operations
   * @returns a sorted/filtered array of solver operations
   */
  public async sortSolverOperations(
    userOp: UserOperation,
    solverOps: SolverOperation[],
  ): Promise<SolverOperation[]> {
    const callConfig = userOp.callConfig();

    if (flagExPostBids(callConfig)) {
      // Sorting will be done onchain during execution
      return solverOps;
    }

    const sortedSolverOpsResp: any[] = await this.sorter.sortBids(
      userOp.toStruct(),
      solverOps.map((solverOp) => solverOp.toStruct()),
    );

    const sortedSolverOps: SolverOperation[] = sortedSolverOpsResp.map((op) =>
      OperationBuilder.newSolverOperation(op),
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
   * @param bundler the address of the desired bundler
   * @returns a valid dApp operation
   */
  public async createDAppOperation(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    bundler: string = ZeroAddress,
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

    const callConfig = userOp.callConfig();
    const eip712Domain = (await chainConfig(this.chainId, this.atlasVersion)).eip712Domain;

    const userOpHash = userOp.hash(
      eip712Domain,
      flagTrustedOpHash(callConfig),
    );

    const dAppOp: DAppOperation =
      OperationBuilder.newDAppOperationFromUserSolvers(
        userOpHash,
        userOp,
        solverOps,
        sessionAccount,
        bundler,
      );

    const signature = await sessionAccount.signTypedData(
      eip712Domain,
      dAppOp.toTypedDataTypes(),
      dAppOp.toTypedDataValues(),
    );

    dAppOp.setField("signature", signature);
    dAppOp.validateSignature(eip712Domain);

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
    dAppOp: DAppOperation,
  ): string {
    return this.iAtlas.encodeFunctionData("metacall", [
      userOp.toStruct(),
      solverOps.map((solverOp) => solverOp.toStruct()),
      dAppOp.toStruct(),
    ]);
  }

  /**
   * Submits all operations to the backend for bundling.
   * @param userOp a signed user operation
   * @param solverOps an array of solver operations
   * @param dAppOp a signed dApp operation
   * @returns the hashes of the generated Atlas transaction
   */
  public async submitBundle(
    chainId: number,
    userOp: UserOperation,
    solverOps: SolverOperation[],
    dAppOp: DAppOperation,
    options: any = {},
  ): Promise<string[]> {
    const sessionKey = userOp.getField("sessionKey").value as string;
    if (
      sessionKey !== ZeroAddress &&
      sessionKey !== dAppOp.getField("from").value
    ) {
      throw new Error(
        "User operation session key does not match dApp operation",
      );
    }

    const bundle = OperationBuilder.newBundle(
      chainId,
      userOp,
      solverOps,
      dAppOp,
    );

    const eip712Domain = (await chainConfig(this.chainId, this.atlasVersion)).eip712Domain;
    bundle.validate(eip712Domain);

    const result = await this.backend.submitBundle(
      this.chainId,
      this.atlasVersion,
      bundle,
      options,
    );

    return result;
  }

  /**
   * Adds hooks controllers to the backend.
   * @param hooksControllers An array of hooks controllers
   */
  public addHooksControllers(hooksControllers: IHooksController[]): void {
    this.backend.addHooksControllers(hooksControllers);
  }
}
