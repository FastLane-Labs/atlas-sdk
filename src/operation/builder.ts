import { HDNodeWallet, ZeroAddress, keccak256 } from "ethers";
import { UserOperation, SolverOperation, DAppOperation, Bundle } from "./";
import { getCallChainHash } from "../utils";

export const ZeroUint = 0n;
export const ZeroBytes = "0x";

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
    callConfig?: bigint;
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
      callConfig: prop.callConfig || ZeroUint,
      sessionKey: prop.sessionKey || ZeroAddress,
      data: prop.data,
      signature: prop.signature || ZeroBytes,
    });

    userOp.validateFields();
    return userOp;
  }

  public static newSolverOperation(
    prop: {
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
    },
    score?: number,
  ): SolverOperation {
    const solverOp = new SolverOperation(score);
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
    userOpHash: string,
    userOp: UserOperation,
    solverOps: SolverOperation[],
    signer: HDNodeWallet,
    bundler: string = ZeroAddress,
  ): DAppOperation {
    const userTo = userOp.getField("to").value;
    if (userTo === undefined) {
      throw new Error("UserOperation to is undefined");
    }

    const userDeadline = userOp.getField("deadline").value;
    if (userDeadline === undefined) {
      throw new Error("UserOperation deadline is undefined");
    }

    const dAppControl = userOp.getField("control").value;
    if (dAppControl === undefined) {
      throw new Error("UserOperation control is undefined");
    }

    return this.newDAppOperation({
      from: signer.address,
      to: userTo as string,
      nonce: 1n,
      deadline: userDeadline as bigint,
      control: dAppControl as string,
      bundler: bundler,
      userOpHash: userOpHash,
      callChainHash: getCallChainHash(userOp, solverOps),
      signature: ZeroBytes,
    });
  }

  public static newBundle(
    chainId: number,
    userOp: UserOperation,
    solverOps: SolverOperation[],
    dAppOp: DAppOperation,
  ): Bundle {
    return new Bundle(chainId, userOp, solverOps, dAppOp);
  }
}
