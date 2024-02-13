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
    value: "0",
    gas: "0",
    maxFeePerGas: "0",
    nonce: "0",
    deadline: "0",
    dapp: ZeroAddress,
    control: ZeroAddress,
    sessionKey: "0x",
    data: "0x",
    signature: "0x",
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
    value: "0",
    gas: "0",
    maxFeePerGas: "0",
    deadline: "0",
    solver: ZeroAddress,
    control: ZeroAddress,
    userOpHash: zeroPadBytes("0x", 32),
    bidToken: ZeroAddress,
    bidAmount: "0",
    data: "0x",
    signature: "0x",
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
    value: "0",
    gas: "0",
    maxFeePerGas: "0",
    nonce: "0",
    deadline: "0",
    control: ZeroAddress,
    bundler: ZeroAddress,
    userOpHash: "",
    callChainHash: "",
    signature: "",
  };
}
