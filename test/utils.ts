import { ZeroAddress, zeroPadBytes } from "ethers";
import {
  UserOperation,
  SolverOperation,
  DAppOperation,
} from "../src/operation";

/**
 * Generate a valid user operation.
 * @returns a valid user operation
 */
export function generateUserOperation(): UserOperation {
  return {
    from: ZeroAddress,
    to: "0x590cBb439Bfb3C37ad6CcE12C92427B0358cB4Dd",
    value: 1n,
    gas: 1n,
    maxFeePerGas: 1n,
    nonce: 1n,
    deadline: BigInt(Math.floor(Date.now() / 1000 + 1000)),
    dapp: ZeroAddress,
    control: ZeroAddress,
    sessionKey: "",
    data: "0x01",
    signature: "0x0001",
  };
}

/**
 * Generate a valid solver operation.
 * @returns a valid solver operation
 */
export function generateSolverOperation(): SolverOperation {
  return {
    from: ZeroAddress,
    to: ZeroAddress,
    value: 0n,
    gas: 0n,
    maxFeePerGas: 0n,
    deadline: 0n,
    solver: ZeroAddress,
    control: ZeroAddress,
    userOpHash: zeroPadBytes("0x", 32),
    bidToken: ZeroAddress,
    bidAmount: 0n,
    data: "0x00",
    signature: "0x00",
  };
}

/**
 * Generate a valid dApp operation.
 * @returns a valid dApp operation
 */
export function generateDAppOperation(): DAppOperation {
  return {
    from: ZeroAddress,
    to: ZeroAddress,
    value: 0n,
    gas: 0n,
    nonce: 0n,
    deadline: 0n,
    control: ZeroAddress,
    bundler: ZeroAddress,
    userOpHash: zeroPadBytes("0x", 32),
    callChainHash: zeroPadBytes("0x", 32),
    signature: "0x00",
  };
}
