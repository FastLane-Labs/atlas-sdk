import { ethers } from "ethers";
import { UserOperation, SolverOperation, DAppOperation, Bundle } from "./";
import { getCallChainHash } from "../utils";

export const ZeroUint = 0n;
export const ZeroBytes = "0x";

export abstract class OperationBuilder {
  public static newUserOperation(prop: {
    from: string;
    to: string;
    value: bigint | ethers.BigNumber;
    gas: bigint | ethers.BigNumber;
    maxFeePerGas: bigint | ethers.BigNumber;
    nonce?: bigint | ethers.BigNumber;
    deadline: bigint | ethers.BigNumber;
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
      value: ethers.BigNumber.isBigNumber(prop.value)
        ? prop.value.toBigInt()
        : prop.value,
      gas: ethers.BigNumber.isBigNumber(prop.gas)
        ? prop.gas.toBigInt()
        : prop.gas,
      maxFeePerGas: ethers.BigNumber.isBigNumber(prop.maxFeePerGas)
        ? prop.maxFeePerGas.toBigInt()
        : prop.maxFeePerGas,
      nonce: prop.nonce
        ? ethers.BigNumber.isBigNumber(prop.nonce)
          ? prop.nonce.toBigInt()
          : prop.nonce
        : ZeroUint,
      deadline: ethers.BigNumber.isBigNumber(prop.deadline)
        ? prop.deadline.toBigInt()
        : prop.deadline,
      dapp: prop.dapp,
      control: prop.control,
      sessionKey: prop.sessionKey || ethers.constants.AddressZero,
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
      value: bigint | ethers.BigNumber;
      gas: bigint | ethers.BigNumber;
      maxFeePerGas: bigint | ethers.BigNumber;
      deadline: bigint | ethers.BigNumber;
      solver: string;
      control: string;
      userOpHash: string;
      bidToken: string;
      bidAmount: bigint | ethers.BigNumber;
      data: string;
      signature: string;
    },
    score?: number
  ): SolverOperation {
    const solverOp = new SolverOperation(score);
    solverOp.setFields({
      from: prop.from,
      to: prop.to,
      value: ethers.BigNumber.isBigNumber(prop.value)
        ? prop.value.toBigInt()
        : prop.value,
      gas: ethers.BigNumber.isBigNumber(prop.gas)
        ? prop.gas.toBigInt()
        : prop.gas,
      maxFeePerGas: ethers.BigNumber.isBigNumber(prop.maxFeePerGas)
        ? prop.maxFeePerGas.toBigInt()
        : prop.maxFeePerGas,
      deadline: ethers.BigNumber.isBigNumber(prop.deadline)
        ? prop.deadline.toBigInt()
        : prop.deadline,
      solver: prop.solver,
      control: prop.control,
      userOpHash: prop.userOpHash,
      bidToken: prop.bidToken,
      bidAmount: ethers.BigNumber.isBigNumber(prop.bidAmount)
        ? prop.bidAmount.toBigInt()
        : prop.bidAmount,
      data: prop.data,
      signature: prop.signature,
    });

    solverOp.validateFields();
    return solverOp;
  }

  public static newDAppOperation(prop: {
    from: string;
    to: string;
    value: bigint | ethers.BigNumber;
    gas: bigint | ethers.BigNumber;
    nonce: bigint | ethers.BigNumber;
    deadline: bigint | ethers.BigNumber;
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
      value: ethers.BigNumber.isBigNumber(prop.value)
        ? prop.value.toBigInt()
        : prop.value,
      gas: ethers.BigNumber.isBigNumber(prop.gas)
        ? prop.gas.toBigInt()
        : prop.gas,
      nonce: ethers.BigNumber.isBigNumber(prop.nonce)
        ? prop.nonce.toBigInt()
        : prop.nonce,
      deadline: ethers.BigNumber.isBigNumber(prop.deadline)
        ? prop.deadline.toBigInt()
        : prop.deadline,
      control: prop.control,
      bundler: prop.bundler || ethers.constants.AddressZero,
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
    signer: ethers.Wallet,
    requirePreOps: boolean,
    bundler: string = ethers.constants.AddressZero
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
      value: 0n,
      gas: 0n,
      nonce: 1n,
      deadline: userDeadline as bigint,
      control: dAppControl as string,
      bundler: bundler,
      userOpHash: ethers.utils.keccak256(userOp.abiEncode()),
      callChainHash: getCallChainHash(
        userOp,
        solverOps,
        requirePreOps,
        dAppControl as string
      ),
      signature: ZeroBytes,
    });
  }

  public static newBundle(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    dAppOp: DAppOperation
  ): Bundle {
    return new Bundle(userOp, solverOps, dAppOp);
  }
}
