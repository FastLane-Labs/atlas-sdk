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
    let solverOps: SolverOperation[] = [];
    for (let i = 0; i < 5; i++) {
      solverOps.push(generateSolverOperation());
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
  public static create() {
    const server = express();
    server.use(express.json());
    server.post("/", rpcHandler(RPCService));
    return server.listen(3000);
  }
}
