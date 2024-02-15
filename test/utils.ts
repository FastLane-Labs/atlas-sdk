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
    to: ZeroAddress,
    value: "0x0",
    gas: "0x0",
    maxFeePerGas: "0x0",
    nonce: "0x0",
    deadline: "0x0",
    dapp: ZeroAddress,
    control: ZeroAddress,
    sessionKey: "",
    data: "0x1234",
    signature: "0x0",
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
    value: "0x0",
    gas: "0x0",
    maxFeePerGas: "0x0",
    deadline: "0x0",
    solver: ZeroAddress,
    control: ZeroAddress,
    userOpHash: zeroPadBytes("0x", 32),
    bidToken: ZeroAddress,
    bidAmount: "0x0",
    data: "0x0",
    signature: "0x0",
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
    value: "0x0",
    gas: "0x0",
    maxFeePerGas: "0x0",
    nonce: "0x0",
    deadline: "0x0",
    control: ZeroAddress,
    bundler: ZeroAddress,
    userOpHash: zeroPadBytes("0x", 32),
    callChainHash: zeroPadBytes("0x", 32),
    signature: "0x0",
  };
}
