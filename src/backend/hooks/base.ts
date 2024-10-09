import { AbstractProvider } from "ethers";
import { UserOperation, SolverOperation, Bundle } from "../../operation";

export interface IHooksController {
  preSubmitUserOperation(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<[UserOperation, string[], any]>;

  postSubmitUserOperation(
    chainId: number,
    userOp: UserOperation,
    userOphash: string,
    extra?: any,
  ): Promise<[UserOperation, string]>;

  preGetSolverOperations(
    chainId: number,
    userOp: UserOperation,
    userOphash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<[UserOperation, string, boolean, any]>;

  postGetSolverOperations(
    chainId: number,
    userOp: UserOperation,
    solverOps: SolverOperation[],
    extra?: any,
  ): Promise<[UserOperation, SolverOperation[]]>;

  preSubmitBundle(
    chainId: number,
    bundle: Bundle,
    extra?: any,
  ): Promise<[Bundle, any]>;

  postSubmitBundle(
    chainId: number,
    result: string,
    extra?: any,
  ): Promise<string>;

  preGetBundleHash(
    chainId: number,
    userOphash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<[string, boolean, any]>;

  postGetBundleHash(
    chainId: number,
    atlasTxHash: string,
    extra?: any,
  ): Promise<string>;

  preGetBundleForUserOp(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<[UserOperation, string[], boolean | undefined, any]>;

  postGetBundleForUserOp(
    chainId: number,
    bundle: Bundle,
    extra?: any,
  ): Promise<Bundle>;
}

export interface IHooksControllerConstructable {
  new (provider: AbstractProvider): IHooksController;
}

export abstract class BaseHooksController implements IHooksController {
  constructor(protected provider: AbstractProvider) {}

  async preSubmitUserOperation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<[UserOperation, string[], any]> {
    return [userOp, hints, extra];
  }

  async postSubmitUserOperation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chainId: number,
    userOp: UserOperation,
    userOphash: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extra?: any,
  ): Promise<[UserOperation, string]> {
    return [userOp, userOphash];
  }

  async preGetSolverOperations(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chainId: number,
    userOp: UserOperation,
    userOphash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<[UserOperation, string, boolean, any]> {
    return [userOp, userOphash, wait || false, extra];
  }

  async postGetSolverOperations(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chainId: number,
    userOp: UserOperation,
    solverOps: SolverOperation[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extra?: any,
  ): Promise<[UserOperation, SolverOperation[]]> {
    return [userOp, solverOps];
  }

  async preSubmitBundle(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chainId: number,
    bundle: Bundle,
    extra?: any,
  ): Promise<[Bundle, any]> {
    return [bundle, extra];
  }

  async postSubmitBundle(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chainId: number,
    result: string,
  ): Promise<string> {
    return result;
  }

  async preGetBundleHash(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chainId: number,
    userOphash: string,
    wait: boolean,
    extra?: any,
  ): Promise<[string, boolean, any]> {
    return [userOphash, wait, extra];
  }

  async postGetBundleHash(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chainId: number,
    atlasTxHash: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extra?: any,
  ): Promise<string> {
    return atlasTxHash;
  }

  async preGetBundleForUserOp(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<[UserOperation, string[], boolean | undefined, any]> {
    return [userOp, hints, wait, extra];
  }

  async postGetBundleForUserOp(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chainId: number,
    bundle: Bundle,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extra?: any,
  ): Promise<Bundle> {
    return bundle;
  }
}
