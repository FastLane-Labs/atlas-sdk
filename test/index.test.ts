import { ExternalProvider } from "@ethersproject/providers";
import { isAddress } from "@ethersproject/address";
import { AddressZero } from "@ethersproject/constants";
import { HttpProvider } from "web3-providers-http";
import { AtlasSDK } from "../src/index";
import { MockOperationRelay } from "./mockOperationRelay";
import { generateUserOperation } from "./utils";
import dotenv from "dotenv";

dotenv.config();

describe("Atlas SDK tests", () => {
  const provider = new HttpProvider(process.env.PROVIDER_RPC_URL!);
  const portListen = 3000;
  const opsRelay = MockOperationRelay.create(portListen);
  const atlasSDK = new AtlasSDK(
    `http://127.0.0.1:${portListen}`,
    provider as unknown as ExternalProvider,
    Number(process.env.CHAIN_ID!)
  );

  afterAll(() => {
    opsRelay.close();
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
    userOp.sessionKey = AddressZero;
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
});
