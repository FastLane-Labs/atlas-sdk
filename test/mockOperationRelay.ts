import { rpcHandler } from "typed-rpc/express";
import {
  UserOperation,
  SolverOperation,
  DAppOperation,
} from "../src/operation";
import { generateSolverOperation } from "./utils";
import express from "express";

const RPCService = {
  submitUserOperation(userOp: UserOperation): SolverOperation[] {
    /*
     * This is a mock implementation of the submitUserOperation method.
     * the "data" field of the user operation holds information about the
     * desired result returned (for testing purposes only).
     * The "data" field is a stringified JSON object formatted as:
     * { "test": "submitUserOperation", "solverOps": { "total": 5, "valid: 3" } }
     */

    let solverOps: SolverOperation[] = [];
    let data = JSON.parse(userOp.data);

    if (data.test === "submitUserOperation") {
      for (let i = 0; i < data.solverOps.total; i++) {
        solverOps.push(generateSolverOperation());
      }
    }

    return solverOps;
  },

  submitAllOperations(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    dAppOp: DAppOperation
  ): string {
    return "";
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
