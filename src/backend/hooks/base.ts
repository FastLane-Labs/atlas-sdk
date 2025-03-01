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
}
