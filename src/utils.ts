import {
  isAddress,
  AbiCoder,
  keccak256,
  solidityPacked,
  Interface,
  zeroPadBytes,
  HDNodeWallet,
  toUtf8Bytes,
  hexlify,
} from "ethers";
import { UserOperation, SolverOperation, DAppOperation } from "./operation";
import dAppControlAbi from "./abi/DAppControl.json";

export function validateAddress(address: string): boolean {
  // isAddress returns true for ICAP addresses, add a length check to exclude them
  return isAddress(address) && address.length === 42;
}

export function validateUint256(value: bigint): boolean {
  return value <= 2n ** 256n - 1n;
}

export function validateBytes32(value: string): boolean {
  return /^0x[0-9a-f]{64}$/.test(value);
}

export function validateBytes(value: string): boolean {
  return /^0x([0-9a-f][0-9a-f])*$/.test(value);
}

/**
 * Get a user operation structure abi encoded.
 * @param userOp a user operation
 * @returns the user operation abi encoded
 */
export function abiEncodeUserOperation(userOp: UserOperation): string {
  return new AbiCoder().encode(
    [
      "tuple(address, address, uint256, uint256, uint256, uint256, uint256, address, address, address, bytes, bytes)",
    ],
    [
      [
        userOp.from,
        userOp.to,
        userOp.value,
        userOp.gas,
        userOp.maxFeePerGas,
        userOp.nonce,
        userOp.deadline,
        userOp.dapp,
        userOp.control,
        userOp.sessionKey,
        userOp.data,
        userOp.signature,
      ],
    ]
  );
}

/**
 * Get a solver operation structure abi encoded.
 * @param userOp a solver operation
 * @returns the solver operation abi encoded
 */
export function abiEncodeSolverOperation(solverOp: SolverOperation): string {
  return new AbiCoder().encode(
    [
      "tuple(address, address, uint256, uint256, uint256, uint256, address, address, bytes32, address, uint256, bytes, bytes)",
    ],
    [
      [
        solverOp.from,
        solverOp.to,
        solverOp.value,
        solverOp.gas,
        solverOp.maxFeePerGas,
        solverOp.deadline,
        solverOp.solver,
        solverOp.control,
        solverOp.userOpHash,
        solverOp.bidToken,
        solverOp.bidAmount,
        solverOp.data,
        solverOp.signature,
      ],
    ]
  );
}

/**
 * Get the call chain hash.
 * @param callConfig the dApp call configuration
 * @param dAppControl the dApp control contract address
 * @param userOp a signed user operation
 * @param solverOps an array of solver operations
 * @returns a call chain hash
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
          dAppControlInterface.encodeFunctionData("preOpsCall", [userOp]),
          counter++,
        ]
      )
    );
  }

  // User call
  callSequenceHash = keccak256(
    solidityPacked(
      ["bytes32", "bytes", "uint256"],
      [callSequenceHash, abiEncodeUserOperation(userOp), counter++]
    )
  );

  // Solver calls
  for (const solverOp of solverOps) {
    callSequenceHash = keccak256(
      solidityPacked(
        ["bytes32", "bytes", "uint256"],
        [callSequenceHash, abiEncodeSolverOperation(solverOp), counter++]
      )
    );
  }

  return callSequenceHash;
}

/**
 * Sign an EIP712 message.
 * @param domainSeparator the EIP712 domain separator
 * @param hashedData the hashed data
 * @param signer the signer
 * @returns the signature
 */
export function signEip712(
  domainSeparator: string,
  hashedData: string,
  signer: HDNodeWallet
): string {
  const messageHash: string = keccak256(
    solidityPacked(
      ["bytes", "bytes32", "bytes32"],
      [hexlify(toUtf8Bytes("\x19\x01")), domainSeparator, hashedData]
    )
  );
  return signer.signingKey.sign(messageHash).serialized;
}
