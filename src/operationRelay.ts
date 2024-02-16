import { rpcClient, RpcError } from "typed-rpc";
import { UserOperation, SolverOperation, DAppOperation } from "./operation";

/**
 * Operation relay's RPC methods definitions.
 */
export type OperationRelayRPCSservice = {
  submitUserOperation(userOp: UserOperation): SolverOperation[];
  submitAllOperations(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    dAppOp: DAppOperation
  ): string;
};

/**
 * Represents an operation relay, and has methods for helping submit operations.
 */
export class OperationRelay {
  private rpcClient: any;
  timeout: number = 1000; // In milliseconds

  /**
   * Creates a new operation relay.
   * @param relayApiEndpoint the url of the operation relay's RPC
   */
  constructor(relayApiEndpoint: string) {
    this.rpcClient = rpcClient<OperationRelayRPCSservice>(relayApiEndpoint);
  }

  /**
   * Submits a user operation to the operation relay.
   * @param userOp the signed user operation to submit
   * @returns an array of solver operations
   */
  public async submitUserOperation(
    userOp: UserOperation
  ): Promise<SolverOperation[]> {
    const res: Promise<SolverOperation[]> =
      this.rpcClient.submitUserOperation(userOp);

    const timeoutId = setTimeout(() => {
      this.rpcClient.$abort(res);
      throw new Error(
        "Operation relay request timed out (submitUserOperation)"
      );
    }, this.timeout);

    let solverOps: SolverOperation[];
    try {
      solverOps = await res;
    } catch (err) {
      if (err instanceof RpcError) {
        throw new Error(err.message);
      }
      throw err;
    }

    clearTimeout(timeoutId);
    return solverOps;
  }

  /**
   * Submits user, solvers and dApp operations for bundling.
   * @param userOp the signed user operation
   * @param solverOps an array of signed solver operations
   * @param dAppOp the signed dApp operation
   * @returns the hash of the resulting Atlas transaction
   */
  public async submitAllOperations(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    dAppOp: DAppOperation
  ): Promise<string> {
    const res: Promise<string> = this.rpcClient.submitAllOperations(
      userOp,
      solverOps,
      dAppOp
    );

    const timeoutId = setTimeout(() => {
      this.rpcClient.$abort(res);
      throw new Error(
        "Operation relay request timed out (submitAllOperations)"
      );
    }, this.timeout);

    let atlasTxHash: string;
    try {
      atlasTxHash = await res;
    } catch (err) {
      if (err instanceof RpcError) {
        throw new Error(err.message);
      }
      throw err;
    }

    clearTimeout(timeoutId);
    return atlasTxHash;
  }
}
