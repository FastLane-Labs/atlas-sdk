import { BrowserProvider, ZeroAddress, isAddress } from "ethers";
import { HttpProvider } from "web3-providers-http";
import { AtlasSDK } from "../src/index";
import { MockOperationRelay } from "./mockOperationRelay";
import { atlasAddress } from "../src/address";
import { generateUserOperation } from "./utils";
import dotenv from "dotenv";

dotenv.config();

describe("Atlas SDK tests", () => {
  const provider = new HttpProvider(process.env.PROVIDER_RPC_URL!);
  const portListen = 3000;
  const opsRelay = MockOperationRelay.create(portListen);
  const atlasSDK = new AtlasSDK(
    `http://127.0.0.1:${portListen}`,
    provider,
    Number(process.env.CHAIN_ID!)
  );

  afterAll(() => {
    opsRelay.close();
  });

  test("buildUserOperation", async () => {
    const mockDappControlAddress = "0xc97dBFFA4b73ff6a6c1C08C61D51F05301581bfC";

    const userOp = await atlasSDK.buildUserOperation({
      from: ZeroAddress,
      destination: ZeroAddress,
      gas: "1",
      maxFeePerGas: "2",
      value: "3",
      deadline: "4",
      data: "0x1234",
      dAppControl: mockDappControlAddress,
    });

    expect(userOp).toBeDefined();
    expect(userOp.from).toBe(ZeroAddress);
    expect(userOp.to).toBe(atlasAddress[Number(process.env.CHAIN_ID!)]);
    expect(userOp.value).toBe("3");
    expect(userOp.gas).toBe("1");
    expect(userOp.maxFeePerGas).toBe("2");
    expect(userOp.nonce).toBe("1");
    expect(userOp.deadline).toBe("4");
    expect(userOp.dapp).toBe(ZeroAddress);
    expect(userOp.control).toBe(mockDappControlAddress);
    expect(userOp.sessionKey).toBe("");
    expect(userOp.data).toBe("0x1234");
    expect(userOp.signature).toBe("");
  });

  test("generateSessionKey", async () => {
    let userOp = generateUserOperation();

    // Session key is not set yet
    expect(isAddress(userOp.sessionKey)).toBe(false);

    // Generate session key
    userOp = atlasSDK.generateSessionKey(userOp);

    // Session key should be valid
    expect(isAddress(userOp.sessionKey)).toBe(true);
  });

  test("submitUserOperation", async () => {
    let userOp = generateUserOperation();

    // No session key generated
    await expect(atlasSDK.submitUserOperation(userOp)).rejects.toThrow(
      "User operation has an invalid session key"
    );

    // Session key not found
    userOp.sessionKey = ZeroAddress;
    await expect(atlasSDK.submitUserOperation(userOp)).rejects.toThrow(
      "Session key not found"
    );

    // Generate valid session key
    userOp = atlasSDK.generateSessionKey(userOp);

    // No solver operations returned
    userOp.data = JSON.stringify({
      test: "submitUserOperation",
      solverOps: { total: 0, valid: 0 },
    });
    await expect(atlasSDK.submitUserOperation(userOp)).rejects.toThrow(
      "No solver operations were returned by the operation relay"
    );

    // 3 solver operations returned
    userOp.data = JSON.stringify({
      test: "submitUserOperation",
      solverOps: { total: 3, valid: 3 },
    });
    const solverOps = await atlasSDK.submitUserOperation(userOp);
    expect(solverOps.length).toBe(3);
  });

  test("sortSolverOperations", async () => {
    // TOFIX
    const userOp = atlasSDK.generateSessionKey(generateUserOperation());
    userOp.data = JSON.stringify({
      test: "submitUserOperation",
      solverOps: { total: 3, valid: 3 },
    });
    const solverOps = await atlasSDK.submitUserOperation(userOp);
    userOp.data = "0x"; // Clear the data field
    const sortedSolverOps = await atlasSDK.sortSolverOperations(
      userOp,
      solverOps
    );
    console.log(sortedSolverOps);
  });

  test("createDAppOperation", async () => {
    // TODO
  });

  test("submitAllOperations", async () => {
    // TODO
  });

  test("createAtlasTransaction", async () => {
    // TODO
  });
});
