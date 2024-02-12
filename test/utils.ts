import { AddressZero } from "@ethersproject/constants";
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
    from: AddressZero,
    to: AddressZero,
    value: "0",
    gas: "0",
    maxFeePerGas: "0",
    nonce: "0",
    deadline: "0",
    dapp: AddressZero,
    control: AddressZero,
    sessionKey: "",
    data: "",
    signature: "",
  };
}

/**
 * Generate a valid solver operation.
 * @returns a valid solver operation
 */
export function generateSolverOperation(): SolverOperation {
  return {
    from: AddressZero,
    to: AddressZero,
    value: "0",
    gas: "0",
    maxFeePerGas: "0",
    deadline: "0",
    solver: AddressZero,
    control: AddressZero,
    userOpHash: "",
    bidToken: AddressZero,
    bidAmount: "0",
    data: "",
    signature: "",
  };
}

/**
 * Generate a valid dApp operation.
 * @returns a valid dApp operation
 */
export function generateDAppOperation(): DAppOperation {
  return {
    from: AddressZero,
    to: AddressZero,
    value: "0",
    gas: "0",
    maxFeePerGas: "0",
    nonce: "0",
    deadline: "0",
    control: AddressZero,
    bundler: AddressZero,
    userOpHash: "",
    callChainHash: "",
    signature: "",
  };
}
