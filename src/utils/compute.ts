import { ethers } from "ethers";
import { UserOperation, SolverOperation } from "../operation";
import dAppControlAbi from "../abi/DAppControl.json";
/**
 * Compute the call chain hash.
 * @param callConfig the dApp call configuration
 * @param dAppControl the dApp control contract address
 * @param userOp a user operation
 * @param solverOps an array of solver operations
 * @returns the call chain hash
 */
export function getCallChainHash(
  userOp: UserOperation,
  solverOps: SolverOperation[],
  requirePreOps: boolean,
  dAppControl: string
): string {
  let callSequenceHash = ethers.constants.HashZero;
  let counter = 0;

  if (requirePreOps) {
    const dAppControlInterface = new ethers.utils.Interface(dAppControlAbi);

    callSequenceHash = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ["bytes32", "address", "bytes", "uint256"],
        [
          callSequenceHash,
          dAppControl,
          dAppControlInterface.encodeFunctionData("preOpsCall", [
            userOp.toStruct(),
          ]),
          counter++,
        ]
      )
    );
  }

  // User call
  callSequenceHash = ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ["bytes32", "bytes", "uint256"],
      [callSequenceHash, userOp.abiEncode(), counter++]
    )
  );

  // Solver calls
  for (const solverOp of solverOps) {
    callSequenceHash = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ["bytes32", "bytes", "uint256"],
        [callSequenceHash, solverOp.abiEncode(), counter++]
      )
    );
  }

  return callSequenceHash;
}
