import { ethers } from "ethers";

export function validateAddress(address: string): boolean {
  // isAddress returns true for ICAP addresses, add a length check to exclude them
  return ethers.utils.isAddress(address) && address.length === 42;
}

export function validateUint256(value: bigint): boolean {
  return value <= BigInt(2 ** 256 - 1);
}

export function validateBytes32(value: string): boolean {
  return /^0x[0-9a-f]{64}$/.test(value);
}

export function validateBytes(value: string): boolean {
  return /^0x([0-9a-f][0-9a-f])*$/.test(value);
}
