import { ethers } from "ethers";
import { UserOperation, SolverOperation } from "../operation";

/**
 * Compute the call chain hash.
 * @param userOp a user operation
 * @param solverOps an array of solver operations
 * @returns the call chain hash
 */
export function getCallChainHash(
  userOp: UserOperation,
  solverOps: SolverOperation[]
): string {
  const callSequence = ethers.utils.solidityPack(
    ["bytes", "bytes"],
    [userOp.abiEncode(), SolverOperation.abiEncodeArray(solverOps)]
  );

  return ethers.utils.keccak256(callSequence);
}
