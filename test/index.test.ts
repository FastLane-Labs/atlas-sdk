import { ExternalProvider } from "@ethersproject/providers";
import { HttpProvider } from "web3-providers-http";
import { AtlasSDK } from "../src/index";
import { MockOperationRelay } from "./mockOperationRelay";
import { generateUserOperation } from "./utils";
import dotenv from "dotenv";

dotenv.config();

describe("Atlas SDK tests", () => {
  const provider = new HttpProvider(
    process.env.PROVIDER_RPC_URL!
  ) as unknown as ExternalProvider;

  const opsRelay = MockOperationRelay.create();
  afterAll(() => {
    opsRelay.close();
  });

  const atlasSDK = new AtlasSDK(
    "http://127.0.0.1:3000",
    provider,
    Number(process.env.CHAIN_ID!)
  );

  test("TODO", async () => {
    const userOp = atlasSDK.generateSessionKey(generateUserOperation());
    const atlasTxHash = await atlasSDK.createAtlasTransaction(userOp);

    expect(0).toBe(0);
  });
});
