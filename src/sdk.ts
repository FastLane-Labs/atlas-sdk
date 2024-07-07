import { ethers } from "ethers";
import {
  UserOperation,
  SolverOperation,
  DAppOperation,
  UserOperationParams,
  OperationBuilder,
  ZeroBytes,
} from "./operation";
import { IBackend } from "./backend";
import { IHooksControllerConstructable } from "./backend/hooks";
import {
  validateAddress,
  flagUserNoncesSequential,
  flagZeroSolvers,
  flagRequirePreOps,
  flagExPostBids,
  flagTrustedOpHash,
} from "./utils";
import { chainConfig } from "./config";
import atlasAbi from "./abi/Atlas.json";
import atlasVerificationAbi from "./abi/AtlasVerification.json";
import dAppControlAbi from "./abi/DAppControl.json";
import sorterAbi from "./abi/Sorter.json";

/**
 * The main class to submit user operations to Atlas.
 */
export class AtlasSdk {
  private iAtlas: ethers.utils.Interface;
  private atlasVerification: ethers.Contract;
  private dAppControl: ethers.Contract;
  private sorter: ethers.Contract;
  private backend: IBackend;
  private sessionKeys: Map<string, ethers.Wallet> = new Map();
  private usersLastNonSequentialNonce: Map<string, ethers.BigNumber> =
    new Map();
  private chainId: number;

  /**
   * Creates a new Atlas SDK instance.
   * @param backend a backend client
   * @param provider a provider
   * @param chainId the chain ID of the network
   */
  constructor(
    provider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider,
    chainId: number,
    backend: IBackend,
    hooksControllers: IHooksControllerConstructable[] = []
  ) {
    this.chainId = chainId;
    this.iAtlas = new ethers.utils.Interface(atlasAbi);
    this.atlasVerification = new ethers.Contract(
      chainConfig[chainId].contracts.atlasVerification.address,
      atlasVerificationAbi,
      provider
    );
    this.dAppControl = new ethers.Contract(
      ethers.constants.AddressZero,
      dAppControlAbi,
      provider
    );
    this.sorter = new ethers.Contract(
      chainConfig[chainId].contracts.sorter.address,
      sorterAbi,
      provider
    );
    const _hooksControllers = hooksControllers.map(
      (HookController) => new HookController(provider, chainId)
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
    generateSessionKey = false
  ): Promise<UserOperation> {
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
      callConfig: userOpParams.callConfig,
      sessionKey: userOpParams.sessionKey,
      data: userOpParams.data,
      signature: userOpParams.signature,
    });

    const dConfig = await this.dAppControl
      .attach(userOpParams.control)
      .getDAppConfig(userOp.toStruct());

    if (!userOpParams.callConfig) {
      userOp.setField("callConfig", dConfig.callConfig);
    } else if (BigInt(dConfig.callConfig) !== userOpParams.callConfig) {
      throw new Error(
        "UserOperation callConfig does not match dApp callConfig"
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
   * Sets the user operation's nonce.
   * @param userOp a user operation
   * @returns the user operation with a valid nonce field
   */
  public async setUserOperationNonce(
    userOp: UserOperation
  ): Promise<UserOperation> {
    const user = userOp.getField("from").value as string;
    let nonce: ethers.BigNumber;

    if (flagUserNoncesSequential(userOp.callConfig())) {
      nonce = await this.atlasVerification.getUserNextNonce(user, true);
    } else {
      if (this.usersLastNonSequentialNonce.has(user)) {
        nonce = await this.atlasVerification.getUserNextNonSeqNonceAfter(
          user,
          this.usersLastNonSequentialNonce.get(user)
        );
      } else {
        nonce = await this.atlasVerification.getUserNextNonce(user, false);
      }
      this.usersLastNonSequentialNonce.set(user, nonce);
    }

    userOp.setField("nonce", nonce.toBigInt());
    return userOp;
  }

  /**
   * Generates a unique session key for this user operation.
   * @param userOp a user operation
   * @returns the user operation with a valid sessionKey field
   */
  public generateSessionKey(userOp: UserOperation): UserOperation {
    const sessionAccount = ethers.Wallet.createRandom();
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
    signer: ethers.Wallet
  ): Promise<UserOperation> {
    userOp.setField(
      "signature",
      await signer._signTypedData(
        chainConfig[this.chainId].eip712Domain,
        userOp.toTypedDataTypes(),
        userOp.toTypedDataValues()
      )
    );
    userOp.validateSignature(chainConfig[this.chainId].eip712Domain);
    return userOp;
  }

  /**
   * Submits a user operation to the backend.
   * @param userOp a signed user operation
   * @param hints an array of addresses used as hints for solvers
   * @returns the user operation hash and an array of solver operations
   */
  public async submitUserOperation(
    userOp: UserOperation,
    hints: string[] = []
  ): Promise<[string, SolverOperation[]]> {
    const sessionKey = userOp.getField("sessionKey").value as string;
    if (
      sessionKey !== ethers.constants.AddressZero &&
      !this.sessionKeys.has(sessionKey)
    ) {
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

    // Submit the user operation to the backend
    const userOphash: string = await this.backend.submitUserOperation(
      userOp,
      hints
    );

    // Get the solver operations
    const solverOps: SolverOperation[] = await this.backend.getSolverOperations(
      userOp,
      userOphash,
      true
    );

    if (solverOps.length === 0 && !flagZeroSolvers(userOp.callConfig())) {
      throw new Error("No solver operations returned");
    }

    return [userOphash, solverOps];
  }

  /**
   * Sorts solver operations and filter out invalid ones.
   * @param userOp a user operation
   * @param solverOps an array of solver operations
   * @returns a sorted/filtered array of solver operations
   */
  public async sortSolverOperations(
    userOp: UserOperation,
    solverOps: SolverOperation[]
  ): Promise<SolverOperation[]> {
    const callConfig = userOp.callConfig();

    if (flagExPostBids(callConfig)) {
      // Sorting will be done onchain during execution
      return solverOps;
    }

    const sortedSolverOpsResp: any[] = await this.sorter.sortBids(
      userOp.toStruct(),
      solverOps.map((solverOp) => solverOp.toStruct())
    );

    const sortedSolverOps: SolverOperation[] = sortedSolverOpsResp.map((op) =>
      OperationBuilder.newSolverOperation(op)
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
   * @returns a valid dApp operation
   */
  public async createDAppOperation(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    bundler: string = ethers.constants.AddressZero
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

    const userOpHash = userOp.hash(
      chainConfig[this.chainId].eip712Domain,
      flagTrustedOpHash(callConfig)
    );

    const dAppOp: DAppOperation =
      OperationBuilder.newDAppOperationFromUserSolvers(
        userOpHash,
        userOp,
        solverOps,
        sessionAccount,
        flagRequirePreOps(callConfig),
        bundler
      );

    const signature = await sessionAccount._signTypedData(
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
   * Submits all operations to the backend for bundling.
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
    const sessionKey = userOp.getField("sessionKey").value as string;
    if (
      sessionKey !== ethers.constants.AddressZero &&
      sessionKey !== dAppOp.getField("from").value
    ) {
      throw new Error(
        "User operation session key does not match dApp operation"
      );
    }

    const bundle = OperationBuilder.newBundle(userOp, solverOps, dAppOp);
    bundle.validate(chainConfig[this.chainId].eip712Domain);

    await this.backend.submitBundle(bundle);

    const atlasTxHash: string = await this.backend.getBundleHash(
      userOpHash,
      true
    );

    return atlasTxHash;
  }
}
