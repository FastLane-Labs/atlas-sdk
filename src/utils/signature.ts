import {
  keccak256,
  solidityPacked,
  HDNodeWallet,
  toUtf8Bytes,
  hexlify,
} from "ethers";

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
