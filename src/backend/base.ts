import { UserOperation, SolverOperation, Bundle } from "../operation";
import { IHooksController } from "./hooks";

export interface IBackend {
  addHooksControllers(hooksControllers: IHooksController[]): void;

  /**
   * Submit a user operation to the backend
   * @summary Submit a user operation to the backend
   * @param {UserOperation} [userOp] The user operation
   * @param {string[]} [hints] Hints for solvers
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The hash of the user operation
   */
  submitUserOperation(
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string>;

  _submitUserOperation(
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string>;

  /**
   * Get solver operations for a user operation previously submitted
   * @summary Get solver operations for a user operation previously submitted
   * @param {UserOperation} userOp The user operation
   * @param {string} userOpHash The hash of the user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [extra] Extra parameters
   * @returns {Promise<SolverOperation[]>} The solver operations
   */
  getSolverOperations(
    userOp: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<SolverOperation[]>;

  _getSolverOperations(
    userOp: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<SolverOperation[]>;

  /**
   * Submit user/solvers/dApp operations to the backend for bundling
   * @summary Submit a bundle of user/solvers/dApp operations to the backend
   * @param {Bundle} [bundle] The user/solvers/dApp operations to be bundled
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The result message
   */
  submitBundle(bundle: Bundle, extra?: any): Promise<string>;

  _submitBundle(bundle: Bundle, extra?: any): Promise<string>;

  /**
   * Get the Atlas transaction hash from a previously submitted bundle
   * @summary Get the Atlas transaction hash from a previously submitted bundle
   * @param {string} userOpHash The hash of the user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The Atlas transaction hash
   */
  getBundleHash(
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<string>;

  _getBundleHash(
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<string>;
}

export abstract class BaseBackend implements IBackend {
  protected hooksControllers: IHooksController[] = [];

  constructor(protected params: { [k: string]: string } = {}) {}

  addHooksControllers(hooksControllers: IHooksController[]): void {
    this.hooksControllers.push(...hooksControllers);
  }

  async submitUserOperation(
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string> {
    // Pre hooks
    for (const hooksController of this.hooksControllers) {
      [userOp, hints] = await hooksController.preSubmitUserOperation(
        userOp,
        hints,
      );
    }

    // Implemented by subclass
    let userOpHash = await this._submitUserOperation(userOp, hints, extra);

    // Post hooks
    for (const hooksController of this.hooksControllers) {
      [userOp, userOpHash] = await hooksController.postSubmitUserOperation(
        userOp,
        userOpHash,
      );
    }

    return userOpHash;
  }

  async getSolverOperations(
    userOp: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<SolverOperation[]> {
    // Pre hooks
    for (const hooksController of this.hooksControllers) {
      [userOp, userOpHash] = await hooksController.preGetSolverOperations(
        userOp,
        userOpHash,
      );
    }

    // Implemented by subclass
    let solverOps = await this._getSolverOperations(
      userOp,
      userOpHash,
      wait,
      extra,
    );

    // Post hooks
    for (const hooksController of this.hooksControllers) {
      [userOp, solverOps] = await hooksController.postGetSolverOperations(
        userOp,
        solverOps,
      );
    }

    return solverOps;
  }

  async submitBundle(bundle: Bundle, extra?: any): Promise<string> {
    // Pre hooks
    for (const hooksController of this.hooksControllers) {
      bundle = await hooksController.preSubmitBundle(bundle);
    }

    // Implemented by subclass
    let result = await this._submitBundle(bundle, extra);

    // Post hooks
    for (const hooksController of this.hooksControllers) {
      result = await hooksController.postSubmitBundle(result);
    }

    return result;
  }

  async getBundleHash(
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<string> {
    // Pre hooks
    for (const hooksController of this.hooksControllers) {
      userOpHash = await hooksController.preGetBundleHash(userOpHash);
    }

    // Implemented by subclass
    let atlasTxHash = await this._getBundleHash(userOpHash, wait, extra);

    // Post hooks
    for (const hooksController of this.hooksControllers) {
      atlasTxHash = await hooksController.postGetBundleHash(atlasTxHash);
    }

    return atlasTxHash;
  }

  async _submitUserOperation(
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string> {
    throw new Error("Method not implemented.");
  }

  async _getSolverOperations(
    userOp: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<SolverOperation[]> {
    throw new Error("Method not implemented.");
  }

  async _submitBundle(bundle: Bundle, extra?: any): Promise<string> {
    throw new Error("Method not implemented.");
  }

  async _getBundleHash(
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
