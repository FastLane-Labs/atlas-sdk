import { isAddress } from "ethers";

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
