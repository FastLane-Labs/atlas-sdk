import { Wallet, ZeroAddress, isAddress, JsonRpcProvider } from "ethers";
// import { AtlasSDK } from "../src/index";
import { SolverOperation } from "../src/operation";
import { randomHash } from "./mockOperationRelay";
// import {
//   generateUserOperation,
//   generateSolverOperation,
//   generateDAppOperation,
// } from "./utils";
import dotenv from "dotenv";
// import { atlasAddress } from "../src/address";

dotenv.config();

describe("Atlas SDK tests", () => {
  // const chainId = Number(process.env.CHAIN_ID!);
  // const provider = new JsonRpcProvider(process.env.PROVIDER_RPC_URL!);
  // const portListen = 8080;
  // const atlasSDK = new AtlasSDK(
  //   `http://127.0.0.1:${portListen}`,
  //   provider,
  //   chainId
  // );
  // // const atlasAddress = "0x644256165e9aC5F617370AB7cecCBD989aC96181";
  // const mockDappControlAddress = "0xAFc62D0645D71A3ad1d4dC411C6D5d9f90E2255F";
  // test("buildUserOperation", async () => {
  //   const userOp = await atlasSDK.buildUserOperation({
  //     from: ZeroAddress,
  //     destination: ZeroAddress,
  //     gas: 1n,
  //     maxFeePerGas: 2n,
  //     value: 3n,
  //     deadline: 4n,
  //     data: "0x1234",
  //     dAppControl: mockDappControlAddress,
  //   });
  //   expect(userOp.from).toBe(ZeroAddress);
  //   expect(userOp.to).toBe(atlasAddress[chainId]);
  //   expect(userOp.value).toBe(3n);
  //   expect(userOp.gas).toBe(1n);
  //   expect(userOp.maxFeePerGas).toBe(2n);
  //   expect(userOp.nonce).toBe(1n);
  //   expect(userOp.deadline).toBe(4n);
  //   expect(userOp.dapp).toBe(ZeroAddress);
  //   expect(userOp.control).toBe(mockDappControlAddress);
  //   expect(userOp.sessionKey).toBe("");
  //   expect(userOp.data).toBe("0x1234");
  //   expect(userOp.signature).toBe("");
  // });
  // test("generateSessionKey", async () => {
  //   let userOp = generateUserOperation();
  //   // Session key is not set yet
  //   expect(isAddress(userOp.sessionKey)).toBe(false);
  //   // Generate session key
  //   userOp = atlasSDK.generateSessionKey(userOp);
  //   // Session key should be valid
  //   expect(isAddress(userOp.sessionKey)).toBe(true);
  // });
  // test("submitUserOperation", async () => {
  //   const signer = Wallet.createRandom();
  //   let userOp = await atlasSDK.buildUserOperation({
  //     from: signer.address,
  //     destination: atlasAddress[chainId],
  //     gas: 1n,
  //     maxFeePerGas: 2n,
  //     value: 3n,
  //     deadline: 999999999999n,
  //     data: "0x1234",
  //     dAppControl: mockDappControlAddress,
  //   });
  //   await expect(atlasSDK.submitUserOperation(userOp)).rejects.toThrow(
  //     "UserOperation: 'sessionKey' is not a valid address ()"
  //   );
  //   // Session key not found
  //   userOp.sessionKey = ZeroAddress;
  //   userOp = await atlasSDK.signUserOperation(userOp, signer);
  //   await expect(atlasSDK.submitUserOperation(userOp)).rejects.toThrow(
  //     "Session key not found"
  //   );
  //   // Generate valid session key
  //   userOp = atlasSDK.generateSessionKey(userOp);
  //   userOp = await atlasSDK.signUserOperation(userOp, signer);
  //   // No solver operations returned
  //   userOp.data = "0x0000";
  //   await expect(atlasSDK.submitUserOperation(userOp)).rejects.toThrow(
  //     "No solver operations were returned by the operation relay"
  //   );
  //   // 3 solver operations returned
  //   userOp.data = "0x0303";
  //   const solverOps = await atlasSDK.submitUserOperation(userOp);
  //   expect(solverOps.length).toBe(3);
  // });
  // test("sortSolverOperations", async () => {
  //   // TOFIX
  //   //   const userOp = atlasSDK.generateSessionKey(generateUserOperation());
  //   //   userOp.data = JSON.stringify({
  //   //     test: "submitUserOperation",
  //   //     solverOps: { total: 3, valid: 3 },
  //   //   });
  //   //   const solverOps = await atlasSDK.submitUserOperation(userOp);
  //   //   userOp.data = ""; // Clear the data field
  //   //   const sortedSolverOps = await atlasSDK.sortSolverOperations(
  //   //     userOp,
  //   //     solverOps
  //   //   );
  // });
  // test("createDAppOperation", async () => {
  //   // TODO
  // });
  // test("submitAllOperations", async () => {
  //   const userOp = atlasSDK.generateSessionKey(generateUserOperation());
  //   const solverOps: SolverOperation[] = [];
  //   solverOps.push(generateSolverOperation());
  //   const dAppOp = generateDAppOperation();
  //   // Session key does not match
  //   await expect(
  //     atlasSDK.submitAllOperations(userOp, solverOps, dAppOp)
  //   ).rejects.toThrow(
  //     "User operation session key does not match dApp operation"
  //   );
  //   dAppOp.from = userOp.sessionKey;
  //   // Operation relay error
  //   userOp.data = "0x00";
  //   await expect(
  //     atlasSDK.submitAllOperations(userOp, solverOps, dAppOp)
  //   ).rejects.toThrow("Operation relay error");
  //   // Atlas transaction hash returned
  //   userOp.data = "0x01";
  //   expect(await atlasSDK.submitAllOperations(userOp, solverOps, dAppOp)).toBe(
  //     randomHash
  //   );
  // });
  // test("createAtlasTransaction", async () => {
  //   // TODO
  // });
});
