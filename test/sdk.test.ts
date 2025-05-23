import {
  JsonRpcProvider,
  toUtf8Bytes,
  HDNodeWallet,
  ZeroAddress,
} from "ethers";
import { AtlasSdk } from "../src";
import { MockBackend } from "../src/backend";
import { OperationBuilder, ZeroBytes } from "../src/operation";
import { validateBytes32, CallConfigIndex } from "../src/utils";
import { AtlasVersion, ChainConfig, chainConfig } from "../src/config";

describe("Atlas SDK main tests", () => {
  let sdk: AtlasSdk;
  let _chainConfig: ChainConfig;

  const chainId = 11155111;
  const atlasVersion: AtlasVersion = "1.0";

  const testDAppControl = "0x60d7B59c6743C25b29a7aEe6F5a37c07B1A6Cff3";

  const signer = HDNodeWallet.fromSeed(
    toUtf8Bytes("bad seed used for this test only"),
  );

  let nonSequentialNonceTracker = 0n;

  const userOpParams = {
    from: signer.address,
    to: "",
    value: 0n,
    gas: 100000n,
    maxFeePerGas: 30000000000n,
    deadline: 0n,
    dapp: testDAppControl,
    control: testDAppControl,
    callConfig: 214256n,
    data: "0x4a9de84900000000000000000000000000000000000000000000000000000000000000200000000000000000000000007439e9bb6d8a84dd3a23fe621a30f95403f87fb90000000000000000000000000000000000000000000000000000b5e620f480000000000000000000000000007b79995e5f793a07bc00c21412e50ecae098e7f9000000000000000000000000000000000000000000000000000000e8d4a51000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000",
  };

  const userOpParamsWithCallConfigFlag = (flagIndex: CallConfigIndex) => {
    const uop = { ...userOpParams };
    uop.callConfig |= 1n << BigInt(flagIndex);
    return uop;
  };

  beforeAll(async () => {
    sdk = await AtlasSdk.create(
      new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com", chainId),
      chainId,
      new MockBackend(),
      [],
      atlasVersion,
    );
    _chainConfig = await chainConfig(chainId, atlasVersion);
    userOpParams.to = _chainConfig.contracts.atlas;
  });

  test("newUserOperation without sessionKey generation", async () => {
    const userOp = await sdk.newUserOperation(userOpParams);

    // Nonce should have been set
    expect(userOp.getField("nonce").value).toBe(++nonSequentialNonceTracker);

    // Session key should not have been set
    expect(userOp.getField("sessionKey").value).toBe(ZeroAddress);
  });

  test("newUserOperation with sessionKey generation", async () => {
    const userOp = await sdk.newUserOperation(userOpParams, true);

    // Nonce should have been set
    expect(userOp.getField("nonce").value).toBe(++nonSequentialNonceTracker);

    // Session key should have been set
    expect(userOp.getField("sessionKey").value).not.toBe(ZeroAddress);
  });

  test("setUserOperationNonce", async () => {
    let userOp = OperationBuilder.newUserOperation(userOpParams);

    // Nonce not yet set
    expect(userOp.getField("nonce").value).toBe(0n);

    // Set nonce
    userOp = await sdk.setUserOperationNonce(userOp);

    // Nonce should have been set
    expect(userOp.getField("nonce").value).toBe(++nonSequentialNonceTracker);
  });

  test("generateSessionKey", () => {
    let userOp = OperationBuilder.newUserOperation(userOpParams);

    // Session key not yet set
    expect(userOp.getField("sessionKey").value).toBe(ZeroAddress);

    // Generate session key
    userOp = sdk.generateSessionKey(userOp);

    // Session key should have been set
    expect(userOp.getField("sessionKey").value).not.toBe(ZeroAddress);
  });

  test("signUserOperation", async () => {
    let userOp = OperationBuilder.newUserOperation(userOpParams);

    // Signature not yet set
    expect(userOp.getField("signature").value).toBe(ZeroBytes);

    // Sign user operation
    userOp = await sdk.signUserOperation(userOp, signer);

    // Signature should have been set
    expect(userOp.getField("signature").value).not.toBe(ZeroBytes);

    // Validate signature
    expect(() =>
      userOp.validateSignature(_chainConfig.eip712Domain),
    ).not.toThrow();
  });

  test("submitUserOperation", async () => {
    const userOp = OperationBuilder.newUserOperation(userOpParams);

    // Submit user operation
    const result = await sdk.submitUserOperation(userOp);

    // Validate result
    expect(Array.isArray(result)).toBe(true);
    expect((result as string[]).length).toBeGreaterThan(0);
  });

  // test("sortSolverOperations with flag exPostBids", async () => {
  //   const userOpParams = userOpParamsWithCallConfigFlag(
  //     CallConfigIndex.ExPostBids,
  //   );
  //   const userOp = OperationBuilder.newUserOperation(userOpParams);
  //   const solverOps = await sdk.submitUserOperation(chainId, userOp);

  //   const lengthBefore = solverOps.length;

  //   // solverOps non-empty
  //   expect(lengthBefore).toBeGreaterThan(0);

  //   // Sort solver operations
  //   const sortedSolverOps = await sdk.sortSolverOperations(userOp, solverOps);

  //   // solverOps untouched
  //   expect(sortedSolverOps.length).toBe(lengthBefore);
  // });

  // test("sortSolverOperations - 0 ops returned without flag zeroSolvers", async () => {
  //   const userOp = OperationBuilder.newUserOperation(userOpParams);
  //   const solverOps = await sdk.submitUserOperation(chainId, userOp);

  //   // solverOps non-empty
  //   expect(solverOps.length).toBeGreaterThan(0);

  //   // Sort solver operations
  //   expect(async () =>
  //     sdk.sortSolverOperations(userOp, solverOps),
  //   ).rejects.toThrow("No solver operations returned");
  // });

  // test("sortSolverOperations - 0 ops returned with flag zeroSolvers", async () => {
  //   const userOpParams = userOpParamsWithCallConfigFlag(
  //     CallConfigIndex.ZeroSolvers,
  //   );
  //   const userOp = OperationBuilder.newUserOperation(userOpParams);
  //   const solverOps = await sdk.submitUserOperation(chainId, userOp);

  //   // solverOps non-empty
  //   expect(solverOps.length).toBeGreaterThan(0);

  //   // Sort solver operations
  //   const sortedSolverOps = await sdk.sortSolverOperations(userOp, solverOps);

  //   // solverOps empty
  //   expect(sortedSolverOps.length).toBe(0);
  // });

  // test("sortSolverOperations", async () => {
  //   const userOp = OperationBuilder.newUserOperation(userOpParams);

  //   // Tweak the user operation so solutions won't get discarded by the sorter
  //   userOp.setField("gas", 0n);
  //   userOp.setField("maxFeePerGas", 0n);

  //   const solverOps = await sdk.submitUserOperation(chainId, userOp);

  //   // solverOps non-empty
  //   expect(solverOps.length).toBeGreaterThan(0);

  //   // Sort solver operations
  //   const sortedSolverOps = await sdk.sortSolverOperations(userOp, solverOps);

  //   // Sorted solverOps non-empty
  //   expect(sortedSolverOps.length).toBeGreaterThan(0);

  //   // Ensure solverOps are sorted
  //   let prevBidAmount = 0n;
  //   for (let i = 0; i < sortedSolverOps.length; i++) {
  //     const bidAmount = sortedSolverOps[i].getField("bidAmount")
  //       .value as bigint;
  //     if (i === 0) {
  //       prevBidAmount = bidAmount;
  //       continue;
  //     }
  //     expect(bidAmount).toBeLessThanOrEqual(prevBidAmount);
  //     prevBidAmount = bidAmount;
  //   }
  // });

  // test("createDAppOperation session key not found", async () => {
  //   const userOp = OperationBuilder.newUserOperation(userOpParams);
  //   const solverOps = await sdk.submitUserOperation(chainId, userOp);

  //   // Set sessionKey manually (not generated by Atlas)
  //   userOp.setField("sessionKey", "0x1111111111111111111111111111111111111111");

  //   // Invalid session key
  //   expect(
  //     async () => await sdk.createDAppOperation(userOp, solverOps),
  //   ).rejects.toThrow("Session key not found");
  // });

  // test("createDAppOperation", async () => {
  //   let userOp = OperationBuilder.newUserOperation(userOpParams);

  //   // Generate session key
  //   userOp = sdk.generateSessionKey(userOp);

  //   const solverOps = await sdk.submitUserOperation(chainId, userOp);

  //   // Generate dApp operation
  //   const dAppOp = await sdk.createDAppOperation(userOp, solverOps);

  //   // Validate dApp operation
  //   expect(dAppOp.getField("from").value).toBe(
  //     userOp.getField("sessionKey").value,
  //   );

  //   // Validate signature
  //   expect(() =>
  //     dAppOp.validateSignature(chainConfig[chainId].eip712Domain),
  //   ).not.toThrow();
  // });

  // test("getMetacallCalldata", async () => {
  //   let userOp = OperationBuilder.newUserOperation(userOpParams);

  //   // Generate session key
  //   userOp = sdk.generateSessionKey(userOp);

  //   const solverOps = await sdk.submitUserOperation(chainId, userOp);

  //   // Generate dApp operation
  //   const dAppOp = await sdk.createDAppOperation(userOp, solverOps);

  //   // Get metacall calldata
  //   const metacallCalldata = sdk.getMetacallCalldata(userOp, solverOps, dAppOp);

  //   // Validate metacall calldata's function selector only
  //   expect(metacallCalldata.slice(0, 10)).toBe("0x4683d90f");
  // });

  // test("submitBundle invalid session key", async () => {
  //   let userOp = OperationBuilder.newUserOperation(userOpParams);

  //   // Generate session key
  //   userOp = sdk.generateSessionKey(userOp);

  //   const solverOps = await sdk.submitUserOperation(chainId, userOp);

  //   // Generate dApp operation
  //   const dAppOp = await sdk.createDAppOperation(userOp, solverOps);

  //   // Change session key
  //   userOp.setField("sessionKey", "0x1111111111111111111111111111111111111111");

  //   // Invalid session key
  //   expect(
  //     async () => await sdk.submitBundle(chainId, userOp, solverOps, dAppOp),
  //   ).rejects.toThrow(
  //     "User operation session key does not match dApp operation",
  //   );
  // });

  // test("submitBundle", async () => {
  //   let userOp = OperationBuilder.newUserOperation(userOpParams);

  //   // Generate session key
  //   userOp = sdk.generateSessionKey(userOp);

  //   // Sign user operation
  //   userOp = await sdk.signUserOperation(userOp, signer);

  //   const solverOps = await sdk.submitUserOperation(chainId, userOp);

  //   // Generate dApp operation
  //   const dAppOp = await sdk.createDAppOperation(userOp, solverOps);

  //   const atlasTxHash = await sdk.submitBundle(
  //     chainId,
  //     userOp,
  //     solverOps,
  //     dAppOp,
  //   );

  //   // Validate atlasTxHash
  //   expect(validateBytes32(atlasTxHash)).toBe(true);
  // });

  // test("getBundleForUserOp - successful retrieval", async () => {
  //   let userOp = OperationBuilder.newUserOperation(userOpParams);
  //   userOp = sdk.generateSessionKey(userOp);
  //   userOp = await sdk.signUserOperation(userOp, signer);

  //   const hints = ["0x1234567890123456789012345678901234567890"];
  //   const solverOps = await sdk.submitUserOperation(chainId, userOp, hints);
  //   const dAppOp = await sdk.createDAppOperation(userOp, solverOps);

  //   // Submit the bundle
  //   await sdk.submitBundle(chainId, userOp, solverOps, dAppOp);

  //   // Now try to retrieve the bundle using the userOp and hints
  //   // Now try to retrieve the bundle using the userOp
  //   const retrievedBundle = await sdk.getBundleForUserOp(chainId, userOp);

  //   expect(retrievedBundle).toBeDefined();
  //   expect(
  //     retrievedBundle.userOperation.hash(
  //       chainConfig[chainId].eip712Domain,
  //       true,
  //     ),
  //   ).toBe(userOp.hash(chainConfig[chainId].eip712Domain, true));
  //   expect(retrievedBundle.solverOperations.length).toBe(solverOps.length);
  //   expect(retrievedBundle.dAppOperation.abiEncode()).toBe(dAppOp.abiEncode());
  // });

  // test("getBundleForUserOp - non-existent bundle", async () => {
  //   const nonExistentUserOp = OperationBuilder.newUserOperation({
  //     ...userOpParams,
  //     nonce: 999999n, // Use a nonce that's unlikely to exist
  //   });
  //   await expect(
  //     sdk.getBundleForUserOp(chainId, nonExistentUserOp),
  //   ).rejects.toThrow("Bundle not found");
  // });

  // test("getBundleForUserOp - hooks called correctly", async () => {
  //   const mockHooksController = {
  //     preSubmitUserOperation: jest
  //       .fn()
  //       .mockImplementation(async (_chainId, userOp, hints, extra) => [
  //         userOp,
  //         hints,
  //         extra,
  //       ]),
  //     postSubmitUserOperation: jest
  //       .fn()
  //       .mockImplementation(async (_chainId, userOp, userOpHash, _extra) => [
  //         userOp,
  //         userOpHash,
  //       ]),
  //     preGetSolverOperations: jest
  //       .fn()
  //       .mockImplementation(
  //         async (_chainId, userOp, userOpHash, wait, extra) => [
  //           userOp,
  //           userOpHash,
  //           wait,
  //           extra,
  //         ],
  //       ),
  //     postGetSolverOperations: jest
  //       .fn()
  //       .mockImplementation(async (_chainId, userOp, solverOps, _extra) => [
  //         userOp,
  //         solverOps,
  //       ]),
  //     preSubmitBundle: jest
  //       .fn()
  //       .mockImplementation(async (_chainId, bundle, extra) => [bundle, extra]),
  //     postSubmitBundle: jest
  //       .fn()
  //       .mockImplementation(async (_chainId, result, _extra) => result),
  //     preGetBundleHash: jest
  //       .fn()
  //       .mockImplementation(async (_chainId, userOpHash, wait, extra) => [
  //         userOpHash,
  //         wait,
  //         extra,
  //       ]),
  //     postGetBundleHash: jest
  //       .fn()
  //       .mockImplementation(
  //         async (_chainId, atlasTxHash, _extra) => atlasTxHash,
  //       ),
  //     preGetBundleForUserOp: jest
  //       .fn()
  //       .mockImplementation(async (_chainId, userOp, hints, wait, extra) => [
  //         userOp,
  //         hints,
  //         wait,
  //         extra,
  //       ]),
  //     postGetBundleForUserOp: jest
  //       .fn()
  //       .mockImplementation(async (_chainId, bundle, _extra) => bundle),
  //   };

  //   sdk.addHooksControllers([mockHooksController as any]);

  //   let userOp = OperationBuilder.newUserOperation(userOpParams);
  //   userOp = sdk.generateSessionKey(userOp);
  //   userOp = await sdk.signUserOperation(userOp, signer);

  //   const solverOps = await sdk.submitUserOperation(chainId, userOp);
  //   const dAppOp = await sdk.createDAppOperation(userOp, solverOps);

  //   // Submit the bundle
  //   await sdk.submitBundle(chainId, userOp, solverOps, dAppOp);

  //   // Now try to retrieve the bundle
  //   await sdk.getBundleForUserOp(chainId, userOp, []);

  //   expect(mockHooksController.preGetBundleForUserOp).toHaveBeenCalledWith(
  //     chainId,
  //     userOp,
  //     [],
  //     undefined, // wait parameter
  //     undefined, // extra parameter
  //   );
  //   expect(mockHooksController.postGetBundleForUserOp).toHaveBeenCalled();
  // });
});
