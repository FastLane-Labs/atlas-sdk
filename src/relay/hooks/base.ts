import { AbstractProvider } from "ethers";
import { UserOperation, SolverOperation, Bundle } from "../../operation";

export interface IHooksController {
  preSubmitUserOperation(
    userOp: UserOperation,
    hints: string[]
  ): Promise<[UserOperation, string[]]>;

  postSubmitUserOperation(
    userOp: UserOperation,
    userOphash: string
  ): Promise<[UserOperation, string]>;

  preGetSolverOperations(userOphash: string): Promise<string>;

  postGetSolverOperations(
    solverOps: SolverOperation[]
  ): Promise<SolverOperation[]>;

  preSubmitBundle(bundleOps: Bundle): Promise<Bundle>;

  postSubmitBundle(result: string): Promise<string>;

  preGetBundleHash(userOphash: string): Promise<string>;

  postGetBundleHash(atlasTxHash: string): Promise<string>;
}

export interface IHooksControllerConstructable {
  new (provider: AbstractProvider, chainId: number): IHooksController;
}

export abstract class BaseHooksController implements IHooksController {
  constructor(
    protected provider: AbstractProvider,
    protected chainId: number
  ) {}

  async preSubmitUserOperation(
    userOp: UserOperation,
    hints: string[]
  ): Promise<[UserOperation, string[]]> {
    return [userOp, hints];
  }

  async postSubmitUserOperation(
    userOp: UserOperation,
    userOphash: string
  ): Promise<[UserOperation, string]> {
    return [userOp, userOphash];
  }

  async preGetSolverOperations(userOphash: string): Promise<string> {
    return userOphash;
  }

  async postGetSolverOperations(
    solverOps: SolverOperation[]
  ): Promise<SolverOperation[]> {
    return solverOps;
  }

  async preSubmitBundle(bundleOps: Bundle): Promise<Bundle> {
    return bundleOps;
  }

  async postSubmitBundle(result: string): Promise<string> {
    return result;
  }

  async preGetBundleHash(userOphash: string): Promise<string> {
    return userOphash;
  }

  async postGetBundleHash(atlasTxHash: string): Promise<string> {
    return atlasTxHash;
  }
}
