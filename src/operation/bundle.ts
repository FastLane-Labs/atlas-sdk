import { UserOperation, SolverOperation, DAppOperation } from "./";

export class Bundle {
  userOperation: UserOperation;
  solverOperations: SolverOperation[];
  dAppOperation: DAppOperation;

  constructor(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    dAppOp: DAppOperation
  ) {
    this.userOperation = userOp;
    this.solverOperations = solverOps;
    this.dAppOperation = dAppOp;
  }

  public validate(): void {
    this.userOperation.validate();
    this.dAppOperation.validate();
    // We don't validate solver operations
  }
}
