import { AbstractProvider } from "ethers";
import { UserOperation, Bundle } from "../../operation";
import { AtlasVersion } from "../../config/chain";

export interface IHooksController {
  preSubmitUserOperation(
    chainId: number,
    atlasVersion: AtlasVersion,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<[UserOperation, string[], any]>;

  postSubmitUserOperation(
    chainId: number,
    atlasVersion: AtlasVersion,
    userOp: UserOperation,
    result: string[] | Bundle,
    extra?: any,
  ): Promise<[UserOperation, string[] | Bundle]>;

  preSubmitBundle(
    chainId: number,
    atlasVersion: AtlasVersion,
    bundle: Bundle,
    extra?: any,
  ): Promise<[Bundle, any]>;

  postSubmitBundle(
    chainId: number,
    atlasVersion: AtlasVersion,
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
    atlasVersion: AtlasVersion,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<[UserOperation, string[], any]> {
    return [userOp, hints, extra];
  }

  async postSubmitUserOperation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chainId: number,
    atlasVersion: AtlasVersion,
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
    atlasVersion: AtlasVersion,
    bundle: Bundle,
    extra?: any,
  ): Promise<[Bundle, any]> {
    return [bundle, extra];
  }

  async postSubmitBundle(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chainId: number,
    atlasVersion: AtlasVersion,
    result: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extra?: any,
  ): Promise<string[]> {
    return result;
  }
}
