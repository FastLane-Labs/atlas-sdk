import { UserOperation, SolverOperation, Bundle } from "../operation";
import { IHooksController } from "./hooks";

export interface IBackend {
  addHooksControllers(hooksControllers: IHooksController[]): void;

  /**
   * Submit a user operation to the backend
   * @summary Submit a user operation to the backend
   * @param {UserOperation} userOp The user operation
   * @param {string[]} hints Hints for solvers
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
   * @param {Bundle} bundle The user/solvers/dApp operations to be bundled
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

  /**
   * Get the full bundle for a given user operation
   * @summary Get the full bundle for a given user operation
   * @param {UserOperation} userOp The user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [extra] Extra parameters
   * @returns {Promise<Bundle>} The full bundle
   */
  getBundleForUserOp(
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<Bundle>;

  _getBundleForUserOp(
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<Bundle>;
}

export abstract class BaseBackend implements IBackend {
  protected hooksControllers: IHooksController[] = [];
  protected chainId: number;

  constructor(protected params: { [k: string]: string } = {}) {
    this.chainId = Number(params.chainId);
  }

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

  async getBundleForUserOp(
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<Bundle> {
    // Pre hooks
    for (const hooksController of this.hooksControllers) {
      userOp = await hooksController.preGetBundleForUserOp(userOp);
    }

    // Implemented by subclass
    let bundle = await this._getBundleForUserOp(userOp, hints, wait, extra);

    // Post hooks
    for (const hooksController of this.hooksControllers) {
      bundle = await hooksController.postGetBundleForUserOp(bundle);
    }

    return bundle;
  }

  abstract _submitUserOperation(
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string>;

  abstract _getSolverOperations(
    userOp: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<SolverOperation[]>;

  abstract _submitBundle(bundle: Bundle, extra?: any): Promise<string>;

  abstract _getBundleHash(
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<string>;

  abstract _getBundleForUserOp(
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<Bundle>;
}
