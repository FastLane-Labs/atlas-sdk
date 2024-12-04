import { UserOperation, SolverOperation, Bundle } from "../operation";
import { IHooksController } from "./hooks";

export interface IBackend {
  addHooksControllers(hooksControllers: IHooksController[]): void;

  /**
   * Submit a user operation to the backend
   * @summary Submit a user operation to the backend
   * @param {number} chainId The chain ID
   * @param {UserOperation} userOp The user operation
   * @param {string[]} hints Hints for solvers
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string[] | Bundle>} The hashes of the metacall or the full bundle
   */
  submitUserOperation(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string[] | Bundle>;

  _submitUserOperation(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string[] | Bundle>;

  /**
   * Submit user/solvers/dApp operations to the backend for bundling
   * @summary Submit a bundle of user/solvers/dApp operations to the backend
   * @param {number} chainId The chain ID
   * @param {Bundle} bundle The user/solvers/dApp operations to be bundled
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string[]>} The hashes of the metacall
   */
  submitBundle(chainId: number, bundle: Bundle, extra?: any): Promise<string[]>;

  _submitBundle(chainId: number, bundle: Bundle, extra?: any): Promise<string[]>;
}

export abstract class BaseBackend implements IBackend {
  protected hooksControllers: IHooksController[] = [];

  constructor(protected params: { [k: string]: string } = {}) {}

  addHooksControllers(hooksControllers: IHooksController[]): void {
    this.hooksControllers.push(...hooksControllers);
  }

  async submitUserOperation(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string[] | Bundle> {
    // Pre hooks
    for (const hooksController of this.hooksControllers) {
      [userOp, hints, extra] = await hooksController.preSubmitUserOperation(
        chainId,
        userOp,
        hints,
        extra,
      );
    }
    // Implemented by subclass
    let result = await this._submitUserOperation(
      chainId,
      userOp,
      hints,
      extra,
    );

    // Post hooks
    for (const hooksController of this.hooksControllers) {
      [userOp, result] = await hooksController.postSubmitUserOperation(
        chainId,
        userOp,
        result,
        extra,
      );
    }

    return result;
  }

  async submitBundle(
    chainId: number,
    bundle: Bundle,
    extra?: any,
  ): Promise<string[]> {
    // Pre hooks
    for (const hooksController of this.hooksControllers) {
      [bundle, extra] = await hooksController.preSubmitBundle(
        chainId,
        bundle,
        extra,
      );
    }

    // Implemented by subclass
    let result = await this._submitBundle(chainId, bundle, extra);

    // Post hooks
    for (const hooksController of this.hooksControllers) {
      result = await hooksController.postSubmitBundle(chainId, result, extra);
    }

    return result;
  }

  abstract _submitUserOperation(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string[] | Bundle>;

  abstract _submitBundle(
    chainId: number,
    bundle: Bundle,
    extra?: any,
  ): Promise<string[]>;
}
