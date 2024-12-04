import { FastlaneBackend } from "../src/backend/fastlane";
import { OperationBuilder } from "../src/operation/builder";
import {
  UserOperation,
  SolverOperation,
  DAppOperation,
  Bundle,
} from "../src/operation";

describe("FastlaneBackend", () => {
  let backend: FastlaneBackend;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    backend = new FastlaneBackend({ basePath: "https://api.example.com" });
    fetchMock = jest.fn();
    (backend as any).fetch = fetchMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createValidUserOp = (): UserOperation => {
    return OperationBuilder.newUserOperation({
      from: "0x1234567890123456789012345678901234567890",
      to: "0x2345678901234567890123456789012345678901",
      value: BigInt(1),
      gas: BigInt(1000000),
      maxFeePerGas: BigInt(1000000000),
      nonce: BigInt(1),
      deadline: BigInt(1),
      dapp: "0x3456789012345678901234567890123456789012",
      control: "0x4567890123456789012345678901234567890123",
      callConfig: BigInt(1),
      sessionKey: "0x5678901234567890123456789012345678901234",
      data: "0x",
      signature: "0x",
    });
  };

  const createValidDAppOp = (): DAppOperation => {
    return OperationBuilder.newDAppOperation({
      from: "0x1234567890123456789012345678901234567890",
      to: "0x2345678901234567890123456789012345678901",
      nonce: BigInt(1),
      deadline: BigInt(1),
      control: "0x3456789012345678901234567890123456789012",
      bundler: "0x4567890123456789012345678901234567890123",
      userOpHash:
        "0x5678901234567890123456789012345678901234567890123456789012345678",
      callChainHash:
        "0x6789012345678901234567890123456789012345678901234567890123456789",
      signature: "0x",
    });
  };

  const createValidBundle = (): Bundle => {
    return new Bundle(1, createValidUserOp(), [], createValidDAppOp());
  };

  describe("_submitUserOperation", () => {
    it("should submit a user operation successfully", async () => {
      const userOp = createValidUserOp();

      const expectedHash = "0xabcdef1234567890";
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [expectedHash],
      });

      const result = await backend._submitUserOperation(1, userOp, []);
      expect((result as string[])[0]).toBe(expectedHash);
    });

    it("should throw an error if submission fails", async () => {
      const userOp = createValidUserOp();

      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Submission failed" }),
      });

      await expect(backend._submitUserOperation(1, userOp, [])).rejects.toThrow(
        "Submission failed",
      );
    });
  });

  describe("_submitBundle", () => {
    it("should submit a bundle successfully", async () => {
      const mockBundle = createValidBundle();

      const expectedMessage = "Bundle submitted successfully";
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => expectedMessage,
      });

      const result = await backend._submitBundle(1, mockBundle);
      expect(result).toBe(expectedMessage);
    });

    it("should throw an error if bundle submission fails", async () => {
      const mockBundle = createValidBundle();

      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Failed to submit bundle" }),
      });

      await expect(backend._submitBundle(1, mockBundle)).rejects.toThrow(
        "Failed to submit bundle",
      );
    });
  });
});
