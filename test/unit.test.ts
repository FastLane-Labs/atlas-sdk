import { ethers } from "ethers";
import { OperationBuilder } from "../src/operation";
import { getCallChainHash } from "../src/utils";
import { chainConfig } from "../src/config";

describe("Atlas SDK unit tests", () => {
  const testUserOperation = OperationBuilder.newUserOperation({
    from: "0x0000000000000000000000000000000000000001",
    to: "0x0000000000000000000000000000000000000002",
    deadline: BigInt(100),
    gas: BigInt(200),
    nonce: BigInt(300),
    maxFeePerGas: BigInt(400),
    value: BigInt(500),
    dapp: "0x0000000000000000000000000000000000000003",
    control: "0x0000000000000000000000000000000000000004",
    callConfig: BigInt(600),
    sessionKey: "0x0000000000000000000000000000000000000005",
    data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes("data")),
    signature: ethers.utils.hexlify(ethers.utils.toUtf8Bytes("signature")),
  });

  const testSolverOperation = OperationBuilder.newSolverOperation({
    from: "0x0000000000000000000000000000000000000001",
    to: "0x0000000000000000000000000000000000000002",
    value: BigInt(100),
    gas: BigInt(200),
    maxFeePerGas: BigInt(300),
    deadline: BigInt(400),
    solver: "0x0000000000000000000000000000000000000003",
    control: "0x0000000000000000000000000000000000000004",
    userOpHash:
      "0x9999999999999999999999999999999999999999999999999999999999999999",
    bidToken: "0x0000000000000000000000000000000000000005",
    bidAmount: BigInt(500),
    data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes("data")),
    signature: ethers.utils.hexlify(ethers.utils.toUtf8Bytes("signature")),
  });

  const testDAppOperation = OperationBuilder.newDAppOperation({
    from: "0x0000000000000000000000000000000000000001",
    to: "0x0000000000000000000000000000000000000002",
    nonce: BigInt(100),
    deadline: BigInt(200),
    control: "0x0000000000000000000000000000000000000003",
    bundler: "0x0000000000000000000000000000000000000004",
    userOpHash:
      "0x9999999999999999999999999999999999999999999999999999999999999999",
    callChainHash:
      "0x8888888888888888888888888888888888888888888888888888888888888888",
    signature: ethers.utils.hexlify(ethers.utils.toUtf8Bytes("signature")),
  });

  test("abi encode user operation", () => {
    expect(testUserOperation.abiEncode()).toBe(
      "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000001f400000000000000000000000000000000000000000000000000000000000000c80000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000012c0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000258000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000004646174610000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000097369676e61747572650000000000000000000000000000000000000000000000"
    );
  });

  test("abi encode solver operation", () => {
    expect(testSolverOperation.abiEncode()).toBe(
      "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000012c0000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000049999999999999999999999999999999999999999999999999999999999999999000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000001f400000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000004646174610000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000097369676e61747572650000000000000000000000000000000000000000000000"
    );
  });

  test("user operation hash default", () => {
    expect(testUserOperation.hash(chainConfig[0].eip712Domain, false)).toBe(
      "0x021a7f3f62347f1f3d1163aa8eb9fc965e87556aede03c7182ec05bc60311b64"
    );
  });

  test("user operation hash trusted", () => {
    expect(testUserOperation.hash(chainConfig[0].eip712Domain, true)).toBe(
      "0x96aa1212cae2645ba1b8bf8014abccdfe9a60c16f86e21f82753d4cecc0b6089"
    );
  });

  test("callChainHash with required preOps and with solverOps computation", () => {
    const callChainHash = getCallChainHash(
      testUserOperation,
      [testSolverOperation, testSolverOperation, testSolverOperation],
      true,
      "0x0000000000000000000000000000000000000004"
    );

    expect(callChainHash).toBe(
      "0xce835ea8087710762b1d392a3225f5cb50adb278093945e1835b3cc5f3033a82"
    );
  });

  test("callChainHash with required preOps and without solverOps computation", () => {
    const callChainHash = getCallChainHash(
      testUserOperation,
      [],
      true,
      "0x0000000000000000000000000000000000000004"
    );

    expect(callChainHash).toBe(
      "0x38402f35236801c6382b2a79ff78e24d7208744b7253bfb99a8ab19bcab8f824"
    );
  });

  test("callChainHash without required preOps and with solverOps computation", () => {
    const callChainHash = getCallChainHash(
      testUserOperation,
      [testSolverOperation, testSolverOperation, testSolverOperation],
      false,
      "0x0000000000000000000000000000000000000004"
    );

    expect(callChainHash).toBe(
      "0x8a71f907fe61688772ede6e7bb91efa992fe86c27917862adf533984dd56a2b8"
    );
  });

  test("callChainHash without required preOps and without solverOps computation", () => {
    const callChainHash = getCallChainHash(
      testUserOperation,
      [],
      false,
      "0x0000000000000000000000000000000000000004"
    );

    expect(callChainHash).toBe(
      "0x1feca496343f60c6fd5bfa97ec935fed62285b814ef720ac633dabb1c6e25777"
    );
  });

  test("user operation EIP712 signature", async () => {
    const hdNode = ethers.utils.HDNode.fromSeed(
      ethers.utils.toUtf8Bytes("bad seed used for this test only")
    );
    const signer = new ethers.Wallet(hdNode.privateKey);

    const signature = await signer._signTypedData(
      chainConfig[0].eip712Domain,
      testUserOperation.toTypedDataTypes(),
      testUserOperation.toTypedDataValues()
    );

    expect(signature).toBe(
      "0x986094e219f2be26c49bb641ad43a35a7d8b1adf61adf99b21bc85cd72cc562c5fff66b7f7a4241bdea26366ea49e873fb1521bfda86e01e16a778be5c5cce591c"
    );
  });

  test("validate user operation EIP712 signature", () => {
    testUserOperation.setFields({
      from: "0xB764B6545d283C0E547952763F8a843394295da1",
      signature:
        "0x63e05429d1f5253ceebddf5f709c33d211592798cc4f89af302ade417e1de0173dd2c50d1bccc996e68839491a3539c3400c8b0721c29c236a3027f1dc274e151b",
    });

    expect(() =>
      testUserOperation.validateSignature(chainConfig[0].eip712Domain)
    ).not.toThrow();
  });

  test("dApp operation EIP712 signature", async () => {
    const hdNode = ethers.utils.HDNode.fromSeed(
      ethers.utils.toUtf8Bytes("bad seed used for this test only")
    );
    const signer = new ethers.Wallet(hdNode.privateKey);

    const signature = await signer._signTypedData(
      chainConfig[0].eip712Domain,
      testDAppOperation.toTypedDataTypes(),
      testDAppOperation.toTypedDataValues()
    );

    expect(signature).toBe(
      "0x32ec3b06562e1180b8755e4fba47111a879c2d22f99141379bf0a34adcce73a75140677b50fa599adbdd8324de927460fd83f5f8658e6771df75e36597da86e41c"
    );
  });

  test("validate dApp operation EIP712 signature", () => {
    testDAppOperation.setFields({
      from: "0xB764B6545d283C0E547952763F8a843394295da1",
      signature:
        "0x741bd1cc70e34a39d763ae23d0d94c6a9156b10ba9a4cead3e847d4f15ad6edf4a7a60b875f1cb1795358b7a395b422659b7336f2f3a90453f8c2a16369e69d81c",
    });

    expect(() =>
      testDAppOperation.validateSignature(chainConfig[0].eip712Domain)
    ).not.toThrow();
  });
});
