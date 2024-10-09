import { AbstractProvider } from "ethers";
import { UserOperation, SolverOperation, Bundle } from "../../operation";

export interface IHooksController {
  preSubmitUserOperation(
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<[UserOperation, string[], any]>;

  postSubmitUserOperation(
    userOp: UserOperation,
    userOphash: string,
  ): Promise<[UserOperation, string]>;

  preGetSolverOperations(
    userOp: UserOperation,
    userOphash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<[UserOperation, string, boolean, any]>;

  postGetSolverOperations(
    userOp: UserOperation,
    solverOps: SolverOperation[],
  ): Promise<[UserOperation, SolverOperation[]]>;

  preSubmitBundle(bundle: Bundle, extra?: any): Promise<[Bundle, any]>;

  postSubmitBundle(result: string): Promise<string>;

  preGetBundleHash(
    userOphash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<[string, boolean, any]>;

  postGetBundleHash(atlasTxHash: string): Promise<string>;

  preGetBundleForUserOp(
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<[UserOperation, string[], boolean | undefined, any]>;

  postGetBundleForUserOp(bundle: Bundle): Promise<Bundle>;
}

export interface IHooksControllerConstructable {
  new (provider: AbstractProvider, chainId: number): IHooksController;
}

export abstract class BaseHooksController implements IHooksController {
  constructor(
    protected provider: AbstractProvider,
    protected chainId: number,
  ) {}

  async preSubmitUserOperation(
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<[UserOperation, string[], any]> {
    return [userOp, hints, extra];
  }

  async postSubmitUserOperation(
    userOp: UserOperation,
    userOphash: string,
  ): Promise<[UserOperation, string]> {
    return [userOp, userOphash];
  }

  async preGetSolverOperations(
    userOp: UserOperation,
    userOphash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<[UserOperation, string, boolean, any]> {
    return [userOp, userOphash, wait || false, extra];
  }

  async postGetSolverOperations(
    userOp: UserOperation,
    solverOps: SolverOperation[],
  ): Promise<[UserOperation, SolverOperation[]]> {
    return [userOp, solverOps];
  }

  async preSubmitBundle(bundle: Bundle, extra?: any): Promise<[Bundle, any]> {
    return [bundle, extra];
  }

  async postSubmitBundle(result: string): Promise<string> {
    return result;
  }

  async preGetBundleHash(
    userOphash: string,
    wait: boolean,
    extra?: any,
  ): Promise<[string, boolean, any]> {
    return [userOphash, wait, extra];
  }

  async postGetBundleHash(atlasTxHash: string): Promise<string> {
    return atlasTxHash;
  }

  async preGetBundleForUserOp(
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<[UserOperation, string[], boolean | undefined, any]> {
    return [userOp, hints, wait, extra];
  }

  async postGetBundleForUserOp(bundle: Bundle): Promise<Bundle> {
    return bundle;
  }
}
