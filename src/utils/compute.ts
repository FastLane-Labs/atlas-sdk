import { keccak256, solidityPacked, Interface, zeroPadBytes } from "ethers";
import { UserOperation, SolverOperation } from "../operation";
import dAppControlAbi from "../abi/DAppControl.json";

export function getUserOperationHash(userOp: UserOperation): string {
  return keccak256(userOp.abiEncode());
}

export function getAltOperationHash(userOp: UserOperation): string {
  return keccak256(
    solidityPacked(
      ["address", "address", "address", "address", "address"],
      [
        userOp.getField("from"),
        userOp.getField("to"),
        userOp.getField("dapp"),
        userOp.getField("control"),
        userOp.getField("sessionKey"),
      ]
    )
  );
}

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
  let callSequenceHash = zeroPadBytes("0x", 32);
  let counter = 0;

  if (requirePreOps) {
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
