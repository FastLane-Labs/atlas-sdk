import express from "express";
import { rpcHandler } from "typed-rpc/express";
import {
  UserOperation,
  SolverOperation,
  DAppOperation,
} from "../src/operation";
import { generateSolverOperation } from "./utils";

export const randomHash =
  "0xba17854d533ef9fec37ef7acf26b30632990101113543645bb8da9b1ae0bd20f";

const RPCService = {
  submitUserOperation(userOp: UserOperation): SolverOperation[] {
    /*
     * This is a mock implementation of the submitUserOperation method.
     * the "data" field of the user operation holds information about the
     * desired result returned (for testing purposes only).
     * The first byte of the "data" field represent the number of solver operations
     * to be returned. The second byte represents the number of valid solver operations
     * to be returned.
     */

    const totalSolverOps = parseInt(userOp.data.slice(2, 4), 16);
    const validSolverOps = parseInt(userOp.data.slice(4, 6), 16);
    const solverOps: SolverOperation[] = [];

    for (let i = 0; i < totalSolverOps; i++) {
      solverOps.push(generateSolverOperation());
    }

    return solverOps;
  },

  submitAllOperations(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    dAppOp: DAppOperation
  ): string {
    /*
     * This is a mock implementation of the submitAllOperations method.
     * The "data" field of the user operation holds information about the
     * desired result returned (for testing purposes only).
     * The first byte of the "data" field represents a boolean that determines
     * if the operation relay should return a hash or should throw an error.
     */

    const success = userOp.data.slice(2, 4) === "01";
    if (!success) {
      throw new Error("Operation relay error");
    }

    // Returns a random hash for tests
    return randomHash;
  },
};

export class MockOperationRelay {
  public static create(portListen: number) {
    const server = express();
    server.use(express.json());
    server.post("/", rpcHandler(RPCService));
    return server.listen(portListen);
  }
}
