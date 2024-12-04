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
    result: string[] | Bundle,
    extra?: any,
  ): Promise<[UserOperation, string[] | Bundle]>;

  preSubmitBundle(
    chainId: number,
    bundle: Bundle,
    extra?: any,
  ): Promise<[Bundle, any]>;

  postSubmitBundle(
    chainId: number,
    result: string[],
    extra?: any,
  ): Promise<string[]>;
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
    result: string[] | Bundle,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extra?: any,
  ): Promise<[UserOperation, string[] | Bundle]> {
    return [userOp, result];
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
    result: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extra?: any,
  ): Promise<string[]> {
    return result;
  }
}
