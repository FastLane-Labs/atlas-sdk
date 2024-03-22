import { keccak256, solidityPacked, Interface, zeroPadBytes } from "ethers";
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
  callConfig: number,
  dAppControl: string,
  userOp: UserOperation,
  solverOps: SolverOperation[]
): string {
  let callSequenceHash = zeroPadBytes("0x", 32);
  let counter = 0;

  if ((callConfig & 4) !== 0) {
    // Require preOps
    const dAppControlInterface = new Interface(dAppControlAbi);

    callSequenceHash = keccak256(
      solidityPacked(
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
  callSequenceHash = keccak256(
    solidityPacked(
      ["bytes32", "bytes", "uint256"],
      [callSequenceHash, userOp.abiEncode(), counter++]
    )
  );

  // Solver calls
  for (const solverOp of solverOps) {
    callSequenceHash = keccak256(
      solidityPacked(
        ["bytes32", "bytes", "uint256"],
        [callSequenceHash, solverOp.abiEncode(), counter++]
      )
    );
  }

  return callSequenceHash;
}
