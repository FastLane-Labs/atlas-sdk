import { TypedDataDomain } from "ethers";
import { UserOperation, SolverOperation, DAppOperation } from "./";

export class Bundle {
  userOperation: UserOperation;
  solverOperations: SolverOperation[];
  dAppOperation: DAppOperation;

  constructor(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    dAppOp: DAppOperation,
  ) {
    this.userOperation = userOp;
    this.solverOperations = solverOps;
    this.dAppOperation = dAppOp;
  }

  public validate(tdDomain: TypedDataDomain): void {
    this.userOperation.validate(tdDomain);
    this.dAppOperation.validate(tdDomain);
    // We don't validate solver operations
  }

  public toJSON(): any {
    return {
      userOperation: this.userOperation.toStruct(),
      solverOperations: this.solverOperations.map((op) => op.toStruct()),
      dAppOperation: this.dAppOperation.toStruct(),
    };
  }
}
