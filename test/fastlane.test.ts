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
        json: async () => expectedHash,
      });

      const result = await backend._submitUserOperation(1, userOp, []);
      expect(result).toBe(expectedHash);
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

  describe("_getSolverOperations", () => {
    it("should get solver operations successfully", async () => {
      const expectedSolverOps = [
        {
          solverOperation: {
            from: "0x1234567890123456789012345678901234567890",
            to: "0x2345678901234567890123456789012345678901",
            value: "0x1",
            gas: "0xf4240",
            maxFeePerGas: "0x3b9aca00",
            deadline: "0x1",
            solver: "0x3456789012345678901234567890123456789012",
            control: "0x4567890123456789012345678901234567890123",
            userOpHash:
              "0x5678901234567890123456789012345678901234567890123456789012345678",
            bidToken: "0x6789012345678901234567890123456789012345",
            bidAmount: "0x1",
            data: "0x",
            signature: "0x",
          },
          score: 100,
        },
        {
          solverOperation: {
            from: "0x2345678901234567890123456789012345678901",
            to: "0x3456789012345678901234567890123456789012",
            value: "0x2",
            gas: "0xf4240",
            maxFeePerGas: "0x3b9aca00",
            deadline: "0x1",
            solver: "0x4567890123456789012345678901234567890123",
            control: "0x5678901234567890123456789012345678901234",
            userOpHash:
              "0x6789012345678901234567890123456789012345678901234567890123456789",
            bidToken: "0x7890123456789012345678901234567890123456",
            bidAmount: "0x2",
            data: "0x",
            signature: "0x",
          },
          score: 90,
        },
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => expectedSolverOps,
      });

      const userOp = createValidUserOp();
      const result = await backend._getSolverOperations(1, userOp, "0x", true);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(SolverOperation);
      expect(result[0].score).toBe(100);
      expect(result[1]).toBeInstanceOf(SolverOperation);
      expect(result[1].score).toBe(90);

      expect(result[0].getField("from").value).toBe(
        "0x1234567890123456789012345678901234567890",
      );
      expect(result[1].getField("from").value).toBe(
        "0x2345678901234567890123456789012345678901",
      );
    });

    it("should throw an error if getting solver operations fails", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Failed to get solver operations" }),
      });

      const userOp = createValidUserOp();
      await expect(
        backend._getSolverOperations(1, userOp, "0x", true),
      ).rejects.toThrow("Failed to get solver operations");
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

  describe("_getBundleHash", () => {
    it("should get bundle hash successfully", async () => {
      const expectedHash = "0xabcdef1234567890";
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => expectedHash,
      });

      const result = await backend._getBundleHash(1, "0x", true);
      expect(result).toBe(expectedHash);
    });

    it("should throw an error if getting bundle hash fails", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Failed to get bundle hash" }),
      });

      await expect(backend._getBundleHash(1, "0x", true)).rejects.toThrow(
        "Failed to get bundle hash",
      );
    });
  });

  describe("_getBundleForUserOp", () => {
    it("should get bundle for user operation successfully", async () => {
      const mockBundleData = {
        userOperation: createValidUserOp().toStruct(),
        solverOperations: [],
        dAppOperation: createValidDAppOp().toStruct(),
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockBundleData,
      });

      const userOp = createValidUserOp();
      const result = await backend._getBundleForUserOp(1, userOp, [], true);

      expect(result).toBeInstanceOf(Bundle);
      expect(result.userOperation).toBeInstanceOf(UserOperation);
      expect(result.dAppOperation).toBeInstanceOf(DAppOperation);
    });

    it("should throw an error if getting bundle for user operation fails", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => ({
          message: "Failed to get bundle for user operation",
        }),
      });

      const userOp = createValidUserOp();
      await expect(
        backend._getBundleForUserOp(1, userOp, [], true),
      ).rejects.toThrow("Failed to get bundle for user operation");
    });
  });
});
