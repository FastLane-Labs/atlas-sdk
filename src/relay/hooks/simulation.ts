import { AbstractProvider } from "ethers";
import { UserOperation, SolverOperation, Bundle } from "../../operation";
import { BaseHooksController } from "./base";
import { chainConfig } from "../../config";

export class SimulationHooksController extends BaseHooksController {
  constructor(provider: AbstractProvider, chainId: number) {
    super(provider, chainId);
  }

  async preSubmitUserOperation(
    userOp: UserOperation,
    hints: string[]
  ): Promise<[UserOperation, string[]]> {
    console.log("preSubmitUserOperation hooks");
    return [userOp, hints];
  }

  async postGetSolverOperations(
    solverOps: SolverOperation[]
  ): Promise<SolverOperation[]> {
    console.log("postGetSolverOperations hooks");
    return solverOps;
  }

  async preSubmitBundle(bundleOps: Bundle): Promise<Bundle> {
    console.log("preSubmitBundle hooks");
    return bundleOps;
  }
}
