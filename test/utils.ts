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
    from: "0x",
    to: "0x",
    value: "0",
    gas: "0",
    maxFeePerGas: "0",
    nonce: "0",
    deadline: "0",
    dapp: "0x",
    control: "0x",
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
    from: "0x",
    to: "0x",
    value: "0",
    gas: "0",
    maxFeePerGas: "0",
    deadline: "0",
    solver: "0x",
    control: "0x",
    userOpHash: "0x",
    bidToken: "0x",
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
    from: "0x",
    to: "0x",
    value: "0",
    gas: "0",
    maxFeePerGas: "0",
    nonce: "0",
    deadline: "0",
    control: "0x",
    bundler: "0x",
    userOpHash: "0x",
    callChainHash: "0x",
    signature: "0x",
  };
}
