import { BrowserProvider, Contract, ZeroAddress } from "ethers";
import {
  UserOperation,
  UserOperationParams,
  SolverOperation,
  DAppOperation,
} from "./operation";
import { atlasAddress, atlasVerificationAddress } from "./address";
import {
  validateAddress,
  validateUint256,
  validateBytes,
  validateBytes32,
} from "./utils";
import atlasVerificationAbi from "./abi/AtlasVerification.json";
import dAppControlAbi from "./abi/DAppControl.json";

/**
 * Offers helper methods to build user operations.
 */
export class OperationBuilder {
  private chainId: number;
  private atlasVerification: Contract;
  private dAppControl: Contract;

  constructor(provider: BrowserProvider, chainId: number) {
    this.chainId = chainId;
    this.atlasVerification = new Contract(
      atlasVerificationAddress[chainId],
      atlasVerificationAbi,
      provider
    );
    this.dAppControl = new Contract(ZeroAddress, dAppControlAbi, provider);
  }

  /**
   * Builds an unsigned user operation.
   * @param userOperationParams the parameters to build the user operation
   * @returns an unsigned user operation
   */
  public async buildUserOperation(
    userOperationParams: UserOperationParams
  ): Promise<UserOperation> {
    OperationBuilder.validateUserOperationParams(userOperationParams);

    const requireSequencedUserNonces = await this.dAppControl
      .attach(userOperationParams.dAppControl)
      .getFunction("requireSequencedUserNonces")
      .staticCall();

    const nonce: bigint = await this.atlasVerification.getNextNonce(
      userOperationParams.from,
      requireSequencedUserNonces
    );

    return {
      from: userOperationParams.from,
      to: atlasAddress[this.chainId],
      value: userOperationParams.value,
      gas: userOperationParams.gas,
      maxFeePerGas: userOperationParams.maxFeePerGas,
      nonce: nonce,
      deadline: userOperationParams.deadline,
      dapp: userOperationParams.destination,
      control: userOperationParams.dAppControl,
      sessionKey: "",
      data: userOperationParams.data,
      signature: "",
    };
  }

  /**
   * Checks the validity of a UserOperationParams object.
   * @param userOperationParams the object to inspect
   * @returns true if valid, throws an error otherwise
   */
  public static validateUserOperationParams(
    userOperationParams: UserOperationParams
  ): boolean {
    if (!validateAddress(userOperationParams.from)) {
      throw new Error(
        `UserOperationParams: 'from' is not a valid address (${userOperationParams.from})`
      );
    }
    if (!validateAddress(userOperationParams.destination)) {
      throw new Error(
        `UserOperationParams: 'destination' is not a valid address (${userOperationParams.destination})`
      );
    }
    if (!validateUint256(userOperationParams.gas)) {
      throw new Error(
        `UserOperationParams: 'gas' is not a valid uint256 (${userOperationParams.gas})`
      );
    }
    if (!validateUint256(userOperationParams.maxFeePerGas)) {
      throw new Error(
        `UserOperationParams: 'maxFeePerGas' is not a valid uint256 (${userOperationParams.maxFeePerGas})`
      );
    }
    if (!validateUint256(userOperationParams.value)) {
      throw new Error(
        `UserOperationParams: 'value' is not a valid uint256 (${userOperationParams.value})`
      );
    }
    if (!validateUint256(userOperationParams.deadline)) {
      throw new Error(
        `UserOperationParams: 'deadline' is not a valid uint256 (${userOperationParams.deadline})`
      );
    }
    if (!validateBytes(userOperationParams.data)) {
      throw new Error(
        `UserOperationParams: 'data' is not a valid bytes (${userOperationParams.data})`
      );
    }
    if (!validateAddress(userOperationParams.dAppControl)) {
      throw new Error(
        `UserOperationParams: 'dAppControl' is not a valid address (${userOperationParams.dAppControl})`
      );
    }
    return true;
  }

  /**
   * Checks the validity of a user operation object.
   * @param userOp the object to inspect
   * @param checkSessionKey a boolean indicating if the session key should be checked
   * @param checkSignature a boolean indicating if the signature should be checked
   * @returns true if valid, throws an error otherwise
   */
  public static validateUserOperation(
    userOp: UserOperation,
    checkSessionKey: boolean = true,
    checkSignature: boolean = true
  ): boolean {
    if (!validateAddress(userOp.from)) {
      throw new Error(
        `UserOperation: 'from' is not a valid address (${userOp.from})`
      );
    }
    if (!validateAddress(userOp.to)) {
      throw new Error(
        `UserOperation: 'to' is not a valid address (${userOp.to})`
      );
    }
    if (!validateUint256(userOp.value)) {
      throw new Error(
        `UserOperation: 'value' is not a valid uint256 (${userOp.value})`
      );
    }
    if (!validateUint256(userOp.gas)) {
      throw new Error(
        `UserOperation: 'gas' is not a valid uint256 (${userOp.gas})`
      );
    }
    if (!validateUint256(userOp.maxFeePerGas)) {
      throw new Error(
        `UserOperation: 'maxFeePerGas' is not a valid uint256 (${userOp.maxFeePerGas})`
      );
    }
    if (!validateUint256(userOp.nonce)) {
      throw new Error(
        `UserOperation: 'nonce' is not a valid uint256 (${userOp.nonce})`
      );
    }
    if (!validateUint256(userOp.deadline)) {
      throw new Error(
        `UserOperation: 'deadline' is not a valid uint256 (${userOp.deadline})`
      );
    }
    if (!validateAddress(userOp.dapp)) {
      throw new Error(
        `UserOperation: 'dapp' is not a valid address (${userOp.dapp})`
      );
    }
    if (!validateAddress(userOp.control)) {
      throw new Error(
        `UserOperation: 'control' is not a valid address (${userOp.control})`
      );
    }
    if (checkSessionKey && !validateAddress(userOp.sessionKey)) {
      throw new Error(
        `UserOperation: 'sessionKey' is not a valid address (${userOp.sessionKey})`
      );
    }
    if (!validateBytes(userOp.data)) {
      throw new Error(
        `UserOperation: 'data' is not a valid bytes (${userOp.data})`
      );
    }
    if (checkSignature && !validateBytes(userOp.signature)) {
      throw new Error(
        `UserOperation: 'signature' is not a valid bytes (${userOp.signature})`
      );
    }
    return true;
  }

  /**
   * Checks the validity of an array of solver operations.
   * @param solverOps an array of solver operations
   * @returns true if valid, throws an error otherwise
   */
  public static validateSolverOperations(
    solverOps: SolverOperation[]
  ): boolean {
    for (let i = 0; i < solverOps.length; i++) {
      try {
        OperationBuilder.validateSolverOperation(solverOps[i]);
      } catch (err) {
        let message = err;
        if (err instanceof Error) {
          message = err.message;
        }
        throw new Error(`SolverOperation at index ${i} is invalid: ${message}`);
      }
    }
    return true;
  }

  /**
   * Checks the validity of a solver operation object.
   * @param solverOp the object to inspect
   * @returns true if valid, throws an error otherwise
   */
  public static validateSolverOperation(solverOp: SolverOperation): boolean {
    if (!validateAddress(solverOp.from)) {
      throw new Error(
        `SolverOperation: 'from' is not a valid address (${solverOp.from})`
      );
    }
    if (!validateAddress(solverOp.to)) {
      throw new Error(
        `SolverOperation: 'to' is not a valid address (${solverOp.to})`
      );
    }
    if (!validateUint256(solverOp.value)) {
      throw new Error(
        `SolverOperation: 'value' is not a valid uint256 (${solverOp.value})`
      );
    }
    if (!validateUint256(solverOp.gas)) {
      throw new Error(
        `SolverOperation: 'gas' is not a valid uint256 (${solverOp.gas})`
      );
    }
    if (!validateUint256(solverOp.maxFeePerGas)) {
      throw new Error(
        `SolverOperation: 'maxFeePerGas' is not a valid uint256 (${solverOp.maxFeePerGas})`
      );
    }
    if (!validateUint256(solverOp.deadline)) {
      throw new Error(
        `SolverOperation: 'deadline' is not a valid uint256 (${solverOp.deadline})`
      );
    }
    if (!validateAddress(solverOp.solver)) {
      throw new Error(
        `SolverOperation: 'solver' is not a valid address (${solverOp.solver})`
      );
    }
    if (!validateAddress(solverOp.control)) {
      throw new Error(
        `SolverOperation: 'control' is not a valid address (${solverOp.control})`
      );
    }
    if (!validateBytes32(solverOp.userOpHash)) {
      throw new Error(
        `SolverOperation: 'userOpHash' is not a valid bytes32 (${solverOp.userOpHash})`
      );
    }
    if (!validateAddress(solverOp.bidToken)) {
      throw new Error(
        `SolverOperation: 'bidToken' is not a valid address (${solverOp.bidToken})`
      );
    }
    if (!validateUint256(solverOp.bidAmount)) {
      throw new Error(
        `SolverOperation: 'bidAmount' is not a valid uint256 (${solverOp.bidAmount})`
      );
    }
    if (!validateBytes(solverOp.data)) {
      throw new Error(
        `SolverOperation: 'data' is not a valid bytes (${solverOp.data})`
      );
    }
    if (!validateBytes(solverOp.signature)) {
      throw new Error(
        `SolverOperation: 'signature' is not a valid bytes (${solverOp.signature})`
      );
    }
    return true;
  }

  /**
   * Checks the validity of a dApp operation object.
   * @param dAppOp the object to inspect
   * @returns true if valid, throws an error otherwise
   */
  public static validateDAppOperation(dAppOp: DAppOperation): boolean {
    if (!validateAddress(dAppOp.from)) {
      throw new Error(
        `DAppOperation: 'from' is not a valid address (${dAppOp.from})`
      );
    }
    if (!validateAddress(dAppOp.to)) {
      throw new Error(
        `DAppOperation: 'to' is not a valid address (${dAppOp.to})`
      );
    }
    if (!validateUint256(dAppOp.value)) {
      throw new Error(
        `DAppOperation: 'value' is not a valid uint256 (${dAppOp.value})`
      );
    }
    if (!validateUint256(dAppOp.gas)) {
      throw new Error(
        `DAppOperation: 'gas' is not a valid uint256 (${dAppOp.gas})`
      );
    }
    if (!validateUint256(dAppOp.nonce)) {
      throw new Error(
        `DAppOperation: 'nonce' is not a valid uint256 (${dAppOp.nonce})`
      );
    }
    if (!validateUint256(dAppOp.deadline)) {
      throw new Error(
        `DAppOperation: 'deadline' is not a valid uint256 (${dAppOp.deadline})`
      );
    }
    if (!validateAddress(dAppOp.control)) {
      throw new Error(
        `DAppOperation: 'control' is not a valid address (${dAppOp.control})`
      );
    }
    if (!validateAddress(dAppOp.bundler)) {
      throw new Error(
        `DAppOperation: 'bundler' is not a valid address (${dAppOp.bundler})`
      );
    }
    if (!validateBytes32(dAppOp.userOpHash)) {
      throw new Error(
        `DAppOperation: 'userOpHash' is not a valid bytes32 (${dAppOp.userOpHash})`
      );
    }
    if (!validateBytes32(dAppOp.callChainHash)) {
      throw new Error(
        `DAppOperation: 'callChainHash' is not a valid bytes32 (${dAppOp.callChainHash})`
      );
    }
    if (!validateBytes(dAppOp.signature)) {
      throw new Error(
        `DAppOperation: 'signature' is not a valid bytes (${dAppOp.signature})`
      );
    }
    return true;
  }
}
