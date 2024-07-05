import { keccak256, solidityPacked } from "ethers";
import { UserOperation, SolverOperation } from "../operation";

/**
 * Compute the call chain hash.
 * @param userOp a user operation
 * @param solverOps an array of solver operations
 * @param requirePreOps whether to require pre-operations
 * @param dAppControl the dApp control contract address
 * @returns the call chain hash
 */
export function getCallChainHash(
  userOp: UserOperation,
  solverOps: SolverOperation[],
  requirePreOps: boolean,
  dAppControl: string
): string {
  let callSequence = "0x";

  if (requirePreOps) {
    callSequence = solidityPacked(["address"], [dAppControl]);
  }

  callSequence = solidityPacked(
    ["bytes", "bytes", "bytes"],
    [
      callSequence,
      userOp.abiEncode(),
      SolverOperation.abiEncodeArray(solverOps),
    ]
  );

  return keccak256(callSequence);
}
