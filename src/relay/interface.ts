import { UserOperation, SolverOperation, Bundle } from "../operation";

export interface OperationsRelay {
  submitUserOperation(
    userOp: UserOperation,
    hints: string[],
    options?: any
  ): Promise<string>;

  getSolverOperations(
    userOpHash: any,
    wait?: boolean,
    options?: any
  ): Promise<SolverOperation[]>;

  submitBundle(bundle: Bundle, options?: any): Promise<string>;

  getBundleHash(
    userOpHash: any,
    wait?: boolean,
    options?: any
  ): Promise<string>;
}
