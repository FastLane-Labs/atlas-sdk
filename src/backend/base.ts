import { UserOperation, Bundle } from "../operation";
import { IHooksController } from "./hooks";
import { AtlasVersion } from "../config/chain";

export interface IBackend {
  addHooksControllers(hooksControllers: IHooksController[]): void;

  /**
   * Submit a user operation to the backend
   * @summary Submit a user operation to the backend
   * @param {number} chainId The chain ID
   * @param {AtlasVersion} atlasVersion The Atlas version
   * @param {UserOperation} userOp The user operation
   * @param {string[]} hints Hints for solvers
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string[] | Bundle>} The hashes of the metacall or the full bundle
   */
  submitUserOperation(
    chainId: number,
    atlasVersion: AtlasVersion,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string[] | Bundle>;

  _submitUserOperation(
    chainId: number,
    atlasVersion: AtlasVersion,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string[] | Bundle>;
}

export abstract class BaseBackend implements IBackend {
  protected hooksControllers: IHooksController[] = [];

  constructor(protected params: { [k: string]: string } = {}) {}

  addHooksControllers(hooksControllers: IHooksController[]): void {
    this.hooksControllers.push(...hooksControllers);
  }

  async submitUserOperation(
    chainId: number,
    atlasVersion: AtlasVersion,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string[] | Bundle> {
    // Pre hooks
    for (const hooksController of this.hooksControllers) {
      [userOp, hints, extra] = await hooksController.preSubmitUserOperation(
        chainId,
        atlasVersion,
        userOp,
        hints,
        extra,
      );
    }
    // Implemented by subclass
    let result = await this._submitUserOperation(
      chainId,
      atlasVersion,
      userOp,
      hints,
      extra,
    );

    // Post hooks
    for (const hooksController of this.hooksControllers) {
      [userOp, result] = await hooksController.postSubmitUserOperation(
        chainId,
        atlasVersion,
        userOp,
        result,
        extra,
      );
    }

    return result;
  }

  abstract _submitUserOperation(
    chainId: number,
    atlasVersion: AtlasVersion,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string[] | Bundle>;
}
