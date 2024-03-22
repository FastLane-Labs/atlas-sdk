import { HDNodeWallet, ZeroAddress, keccak256 } from "ethers";
import { UserOperation, SolverOperation, DAppOperation, Bundle } from "./";
import { getCallChainHash } from "../utils";
import { chainConfig } from "../config";

const ZeroUint = 0n;
const ZeroBytes = "0x00";

export abstract class OperationBuilder {
  public static newUserOperation(prop: {
    from: string;
    to: string;
    value: bigint;
    gas: bigint;
    maxFeePerGas: bigint;
    nonce?: bigint;
    deadline: bigint;
    dapp: string;
    control: string;
    sessionKey?: string;
    data: string;
    signature?: string;
  }): UserOperation {
    const userOp = new UserOperation();
    userOp.setFields({
      from: prop.from,
      to: prop.to,
      value: prop.value,
      gas: prop.gas,
      maxFeePerGas: prop.maxFeePerGas,
      nonce: prop.nonce || ZeroUint,
      deadline: prop.deadline,
      dapp: prop.dapp,
      control: prop.control,
      sessionKey: prop.sessionKey || ZeroAddress,
      data: prop.data,
      signature: prop.signature || ZeroBytes,
    });

    userOp.validateFields();
    return userOp;
  }

  public static newSolverOperation(prop: {
    from: string;
    to: string;
    value: bigint;
    gas: bigint;
    maxFeePerGas: bigint;
    deadline: bigint;
    solver: string;
    control: string;
    userOpHash: string;
    bidToken: string;
    bidAmount: bigint;
    data: string;
    signature: string;
  }): SolverOperation {
    const solverOp = new SolverOperation();
    solverOp.setFields({
      from: prop.from,
      to: prop.to,
      value: prop.value,
      gas: prop.gas,
      maxFeePerGas: prop.maxFeePerGas,
      deadline: prop.deadline,
      solver: prop.solver,
      control: prop.control,
      userOpHash: prop.userOpHash,
      bidToken: prop.bidToken,
      bidAmount: prop.bidAmount,
      data: prop.data,
      signature: prop.signature,
    });

    solverOp.validateFields();
    return solverOp;
  }

  public static newDAppOperation(prop: {
    from: string;
    to: string;
    value: bigint;
    gas: bigint;
    nonce: bigint;
    deadline: bigint;
    control: string;
    bundler?: string;
    userOpHash: string;
    callChainHash: string;
    signature: string;
  }): DAppOperation {
    const dAppOp = new DAppOperation();
    dAppOp.setFields({
      from: prop.from,
      to: prop.to,
      value: prop.value,
      gas: prop.gas,
      nonce: prop.nonce,
      deadline: prop.deadline,
      control: prop.control,
      bundler: prop.bundler || ZeroAddress,
      userOpHash: prop.userOpHash,
      callChainHash: prop.callChainHash,
      signature: prop.signature,
    });

    dAppOp.validateFields();
    return dAppOp;
  }

  public static newDAppOperationFromUserSolvers(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    signer: HDNodeWallet,
    callConfig: number,
    dAppControl: string,
    chainId: number
  ): DAppOperation {
    const userDeadline = userOp.getField("deadline").value;
    if (userDeadline === undefined) {
      throw new Error("UserOperation deadline is undefined");
    }

    const userControl = userOp.getField("control").value;
    if (userControl === undefined) {
      throw new Error("UserOperation control is undefined");
    }

    if (dAppControl !== userControl) {
      throw new Error("UserOperation control does not match dApp control");
    }

    const dAppOp = new DAppOperation();
    dAppOp.setFields({
      from: signer.publicKey,
      to: chainConfig[chainId].contracts.atlas.address,
      value: 0n,
      gas: 0n,
      nonce: 0n,
      deadline: userDeadline,
      control: userControl,
      bundler: ZeroAddress,
      userOpHash: keccak256(userOp.abiEncode()),
      callChainHash: getCallChainHash(
        callConfig,
        dAppControl,
        userOp,
        solverOps
      ),
      signature: ZeroBytes,
    });

    return dAppOp;
  }

  public static newBundle(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    dAppOp: DAppOperation
  ): Bundle {
    return new Bundle(userOp, solverOps, dAppOp);
  }
}
