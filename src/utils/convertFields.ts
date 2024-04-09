import { TypedDataField, keccak256 } from "ethers";
import { OpFieldType } from "../operation/base";

// Forces an incorrect signature to match a bug in the atlas contract
// TODO: remove
export function createForcedUserOp(
  types: { [key: string]: TypedDataField[] },
  values: { [key: string]: OpFieldType }): [
    { [key: string]: TypedDataField[] },
    { [key: string]: OpFieldType }
  ] {
  types["UserOperation"][10].type = "bytes32";
  values.data = keccak256(values.data as string);
  return [types, values];
}  