import { isAddress, AbiCoder } from "ethers";

export function validateAddress(address: string): boolean {
  // isAddress returns true for ICAP addresses, add a length check to exclude them
  return isAddress(address) && address.length === 42;
}

export function validateUint256(value: string): boolean {
  try {
    const num = BigInt(value);
    return num >= 0 && num <= 2n ** 256n - 1n;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export function validateBytes32(value: string): boolean {
  return /^0x[0-9a-f]{64}$/.test(value);
}

export function validateBytes(value: string): boolean {
  return /^0x([0-9a-f][0-9a-f])*$/.test(value);
}
