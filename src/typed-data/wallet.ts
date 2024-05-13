import { Wallet } from "@ethersproject/wallet";
import {
  TypedDataDomain,
  TypedDataField,
} from "@ethersproject/abstract-signer";
import {
  hexlify,
  concat,
  SignatureLike,
  splitSignature,
} from "@ethersproject/bytes";
import { TypedDataEncoder } from "./json-rpc-signer";
import { Logger } from "@ethersproject/logger";
const logger = new Logger("hash/5.7.0");

export async function signTypedData_wallet(
  wallet: Wallet,
  domain: TypedDataDomain,
  types: Record<string, Array<TypedDataField>>,
  value: Record<string, any>
): Promise<string> {
  // Populate any ENS names
  const populated = await TypedDataEncoder.resolveNames(
    domain,
    types,
    value,
    (name: string) => {
      if (wallet.provider == null) {
        logger.throwError(
          "cannot resolve ENS names without a provider",
          Logger.errors.UNSUPPORTED_OPERATION,
          {
            operation: "resolveName",
            value: name,
          }
        );
      }
      return wallet.provider.resolveName(name) as Promise<string>;
    }
  );

  return joinSignature(
    wallet
      ._signingKey()
      .signDigest(
        TypedDataEncoder.hash(populated.domain, types, populated.value)
      )
  );
}

function joinSignature(signature: SignatureLike): string {
  signature = splitSignature(signature);

  return hexlify(
    concat([
      signature.r,
      signature.s!,
      signature.recoveryParam ? "0x1c" : "0x1b",
    ])
  );
}
