import { hexlify, toUtf8Bytes, HDNodeWallet } from "ethers";
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

  test("abi encode user operation", () => {
    expect(testUserOperation.abiEncode()).toBe(
      "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000001f400000000000000000000000000000000000000000000000000000000000000c80000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000012c0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000004646174610000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000097369676e61747572650000000000000000000000000000000000000000000000"
    );
  });

  test("abi encode solver operation", () => {
    expect(testSolverOperation.abiEncode()).toBe(
      "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000012c0000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000049999999999999999999999999999999999999999999999999999999999999999000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000001f400000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000004646174610000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000097369676e61747572650000000000000000000000000000000000000000000000"
    );
  });

  test("callChainHash with required preOps computation", () => {
    const callChainHash = getCallChainHash(
      testUserOperation,
      [testSolverOperation, testSolverOperation, testSolverOperation],
      true,
      "0x0000000000000000000000000000000000000004"
    );

    expect(callChainHash).toBe(
      "0xbb6a59376026161b088c50619219ae0ca70d2574ef8bf0346064910a4564624a"
    );
  });

  test("callChainHash without required preOps computation", () => {
    const callChainHash = getCallChainHash(
      testUserOperation,
      [testSolverOperation, testSolverOperation, testSolverOperation],
      false,
      "0x0000000000000000000000000000000000000004"
    );

    expect(callChainHash).toBe(
      "0x7a856dd01991620aa2adcb177ef5cdcc9c1f524920d6791817f9272e131f869c"
    );
  });

  test("user operation EIP712 signature", async () => {
    const signer = HDNodeWallet.fromSeed(
      toUtf8Bytes("bad seed used for this test only")
    );

    const signature = await signer.signTypedData(
      chainConfig[0].eip712Domain,
      testUserOperation.toTypedDataTypes(),
      testUserOperation.toTypedDataValues()
    );

    expect(signature).toBe(
      "0x9cd3a1cffa65dd6ac29fe2a608fd8fafece322317b201120e19ac634aba7568d1773d02c3e859b1a4f66c2429def9f36f0ea741fba018bf9beb2bfd72f2f16181c"
    );
  });

  test("validate user operation EIP712 signature", () => {
    testUserOperation.setFields({
      from: "0xB764B6545d283C0E547952763F8a843394295da1",
      signature:
        "0x6ae171d2c70d69413deb2729d2e94244afcf458d7e086fa162ac3b3293fe187b55e306398f82f791ba92e4589dc2269bfa31d92547066145fba8270aaab67edc1b",
    });

    expect(() =>
      testUserOperation.validateSignature(chainConfig[0].eip712Domain)
    ).not.toThrow();
  });

  test("dApp operation EIP712 signature", async () => {
    const signer = HDNodeWallet.fromSeed(
      toUtf8Bytes("bad seed used for this test only")
    );

    const signature = await signer.signTypedData(
      chainConfig[0].eip712Domain,
      testDAppOperation.toTypedDataTypes(),
      testDAppOperation.toTypedDataValues()
    );

    expect(signature).toBe(
      "0x0cb01656f63ab3ad25c3014a49f5172d6419250c71cab60367117d5ebda3d6982bbd0f4940f0a4fd54648d0903b9b3bae880d9c1388cf756f2b239723a5ed2ae1c"
    );
  });

  test("validate dApp operation EIP712 signature", () => {
    testDAppOperation.setFields({
      from: "0xB764B6545d283C0E547952763F8a843394295da1",
      signature:
        "0xc50439032492e702f2cca7c2d171a3e524d8e5828e39e4c9c735529e090e77693b5b7c1132bc9d79cea06dc59656038f72b4067532b3c7f5e723b18692d0d92c1b",
    });

    expect(() =>
      testDAppOperation.validateSignature(chainConfig[0].eip712Domain)
    ).not.toThrow();
  });
});
