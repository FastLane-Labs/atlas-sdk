import { hexlify, toUtf8Bytes, HDNodeWallet } from "ethers";
import { OperationBuilder } from "../src/operation";
import { getCallChainHash } from "../src/utils";
import { AtlasVersion, ChainConfig, chainConfig } from "../src/config";

describe("Atlas SDK unit tests", () => {
  let _chainConfig: ChainConfig;
  const _atlasVersion: AtlasVersion = "1.0";

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
    data: hexlify(toUtf8Bytes("data")),
    signature: hexlify(toUtf8Bytes("signature")),
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
    data: hexlify(toUtf8Bytes("data")),
    signature: hexlify(toUtf8Bytes("signature")),
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
    signature: hexlify(toUtf8Bytes("signature")),
  });

  beforeAll(async () => {
    _chainConfig = await chainConfig(0, _atlasVersion);
  });

  test("abi encode user operation", () => {
    expect(testUserOperation.abiEncode()).toBe(
      "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000001f400000000000000000000000000000000000000000000000000000000000000c80000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000012c0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000258000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000004646174610000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000097369676e61747572650000000000000000000000000000000000000000000000",
    );
  });

  test("abi encode solver operation", () => {
    expect(testSolverOperation.abiEncode()).toBe(
      "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000012c0000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000049999999999999999999999999999999999999999999999999999999999999999000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000001f400000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000004646174610000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000097369676e61747572650000000000000000000000000000000000000000000000",
    );
  });

  test("user operation hash default", () => {
    expect(testUserOperation.hash(_chainConfig.eip712Domain, false)).toBe(
      "0x021a7f3f62347f1f3d1163aa8eb9fc965e87556aede03c7182ec05bc60311b64",
    );
  });

  test("user operation hash trusted", () => {
    expect(testUserOperation.hash(_chainConfig.eip712Domain, true)).toBe(
      "0x96aa1212cae2645ba1b8bf8014abccdfe9a60c16f86e21f82753d4cecc0b6089",
    );
  });

  test("callChainHash with solverOps computation", () => {
    const callChainHash = getCallChainHash(testUserOperation, [
      testSolverOperation,
      testSolverOperation,
      testSolverOperation,
    ]);

    expect(callChainHash).toBe(
      "0x8a71f907fe61688772ede6e7bb91efa992fe86c27917862adf533984dd56a2b8",
    );
  });

  test("callChainHash without solverOps computation", () => {
    const callChainHash = getCallChainHash(testUserOperation, []);

    expect(callChainHash).toBe(
      "0x1feca496343f60c6fd5bfa97ec935fed62285b814ef720ac633dabb1c6e25777",
    );
  });

  test("user operation EIP712 signature", async () => {
    const signer = HDNodeWallet.fromSeed(
      toUtf8Bytes("bad seed used for this test only"),
    );

    const signature = await signer.signTypedData(
      _chainConfig.eip712Domain,
      testUserOperation.toTypedDataTypes(),
      testUserOperation.toTypedDataValues(),
    );

    expect(signature).toBe(
      "0x986094e219f2be26c49bb641ad43a35a7d8b1adf61adf99b21bc85cd72cc562c5fff66b7f7a4241bdea26366ea49e873fb1521bfda86e01e16a778be5c5cce591c",
    );
  });

  test("validate user operation EIP712 signature", () => {
    testUserOperation.setFields({
      from: "0xB764B6545d283C0E547952763F8a843394295da1",
      signature:
        "0x63e05429d1f5253ceebddf5f709c33d211592798cc4f89af302ade417e1de0173dd2c50d1bccc996e68839491a3539c3400c8b0721c29c236a3027f1dc274e151b",
    });

    expect(() =>
      testUserOperation.validateSignature(_chainConfig.eip712Domain),
    ).not.toThrow();
  });

  test("dApp operation EIP712 signature", async () => {
    const signer = HDNodeWallet.fromSeed(
      toUtf8Bytes("bad seed used for this test only"),
    );

    const signature = await signer.signTypedData(
      _chainConfig.eip712Domain,
      testDAppOperation.toTypedDataTypes(),
      testDAppOperation.toTypedDataValues(),
    );

    expect(signature).toBe(
      "0x32ec3b06562e1180b8755e4fba47111a879c2d22f99141379bf0a34adcce73a75140677b50fa599adbdd8324de927460fd83f5f8658e6771df75e36597da86e41c",
    );
  });

  test("validate dApp operation EIP712 signature", () => {
    testDAppOperation.setFields({
      from: "0xB764B6545d283C0E547952763F8a843394295da1",
      signature:
        "0x741bd1cc70e34a39d763ae23d0d94c6a9156b10ba9a4cead3e847d4f15ad6edf4a7a60b875f1cb1795358b7a395b422659b7336f2f3a90453f8c2a16369e69d81c",
    });

    expect(() =>
      testDAppOperation.validateSignature(_chainConfig.eip712Domain),
    ).not.toThrow();
  });

  describe("UserOperation toStruct tests", () => {
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
      data: "0x1234",
      signature: "0x5678",
    });

    test("toStruct encodes all fields correctly", () => {
      const struct = testUserOperation.toStruct();

      expect(struct).toEqual({
        from: "0x0000000000000000000000000000000000000001",
        to: "0x0000000000000000000000000000000000000002",
        deadline: "0x64",
        gas: "0xc8",
        nonce: "0x12c",
        maxFeePerGas: "0x190",
        value: "0x1f4",
        dapp: "0x0000000000000000000000000000000000000003",
        control: "0x0000000000000000000000000000000000000004",
        callConfig: "0x258",
        sessionKey: "0x0000000000000000000000000000000000000005",
        data: "0x1234",
        signature: "0x5678",
      });
    });

    test("toStruct handles undefined values", () => {
      const incompleteUserOp = OperationBuilder.newUserOperation({
        from: "0x0000000000000000000000000000000000000001",
        to: "0x0000000000000000000000000000000000000002",
        deadline: BigInt(100),
        gas: BigInt(200),
        maxFeePerGas: BigInt(400),
        value: BigInt(500),
        dapp: "0x0000000000000000000000000000000000000003",
        control: "0x0000000000000000000000000000000000000004",
        data: "0x1234",
      });

      const struct = incompleteUserOp.toStruct();

      expect(struct).toEqual({
        from: "0x0000000000000000000000000000000000000001",
        to: "0x0000000000000000000000000000000000000002",
        deadline: "0x64",
        gas: "0xc8",
        nonce: "0x0",
        maxFeePerGas: "0x190",
        value: "0x1f4",
        dapp: "0x0000000000000000000000000000000000000003",
        control: "0x0000000000000000000000000000000000000004",
        callConfig: "0x0",
        sessionKey: "0x0000000000000000000000000000000000000000",
        data: "0x1234",
        signature: "0x",
      });
    });

    test("toStruct encodes large numbers correctly", () => {
      const largeNumberUserOp = OperationBuilder.newUserOperation({
        from: "0x0000000000000000000000000000000000000001",
        to: "0x0000000000000000000000000000000000000002",
        deadline: BigInt("1000000000000000000"),
        gas: BigInt("9007199254740991"), // Max safe integer in JavaScript
        nonce: BigInt("340282366920938463463374607431768211455"), // 2^128 - 1
        maxFeePerGas: BigInt(
          "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        ), // 2^256 - 1
        value: BigInt(0),
        dapp: "0x0000000000000000000000000000000000000003",
        control: "0x0000000000000000000000000000000000000004",
        data: "0x1234",
      });

      const struct = largeNumberUserOp.toStruct();

      expect(struct).toEqual({
        from: "0x0000000000000000000000000000000000000001",
        to: "0x0000000000000000000000000000000000000002",
        deadline: "0xde0b6b3a7640000",
        gas: "0x1fffffffffffff",
        nonce: "0xffffffffffffffffffffffffffffffff",
        maxFeePerGas:
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        value: "0x0",
        dapp: "0x0000000000000000000000000000000000000003",
        control: "0x0000000000000000000000000000000000000004",
        callConfig: "0x0",
        sessionKey: "0x0000000000000000000000000000000000000000",
        data: "0x1234",
        signature: "0x",
      });
    });

    test("toStruct lowercases address fields", () => {
      const mixedCaseUserOp = OperationBuilder.newUserOperation({
        from: "0xABCDEF0000000000000000000000000000000001",
        to: "0x0000000000000000000000000000000000000002",
        deadline: BigInt(100),
        gas: BigInt(200),
        maxFeePerGas: BigInt(400),
        value: BigInt(500),
        dapp: "0x0000000000000000000000000000000000000003",
        control: "0xFEDCBA0000000000000000000000000000000004",
        sessionKey: "0x1234560000000000000000000000000000000005",
        data: "0x1234",
      });

      const struct = mixedCaseUserOp.toStruct();

      expect(struct.from).toBe("0xabcdef0000000000000000000000000000000001");
      expect(struct.to).toBe("0x0000000000000000000000000000000000000002");
      expect(struct.dapp).toBe("0x0000000000000000000000000000000000000003");
      expect(struct.control).toBe("0xfedcba0000000000000000000000000000000004");
      expect(struct.sessionKey).toBe(
        "0x1234560000000000000000000000000000000005",
      );
    });
  });
});
