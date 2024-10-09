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
   * @returns {Promise<string>} The hash of the user operation
   */
  submitUserOperation(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string>;

  _submitUserOperation(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string>;

  /**
   * Get solver operations for a user operation previously submitted
   * @summary Get solver operations for a user operation previously submitted
   * @param {number} chainId The chain ID
   * @param {UserOperation} userOp The user operation
   * @param {string} userOpHash The hash of the user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [extra] Extra parameters
   * @returns {Promise<SolverOperation[]>} The solver operations
   */
  getSolverOperations(
    chainId: number,
    userOp: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<SolverOperation[]>;

  _getSolverOperations(
    chainId: number,
    userOp: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<SolverOperation[]>;

  /**
   * Submit user/solvers/dApp operations to the backend for bundling
   * @summary Submit a bundle of user/solvers/dApp operations to the backend
   * @param {number} chainId The chain ID
   * @param {Bundle} bundle The user/solvers/dApp operations to be bundled
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The result message
   */
  submitBundle(chainId: number, bundle: Bundle, extra?: any): Promise<string>;

  _submitBundle(chainId: number, bundle: Bundle, extra?: any): Promise<string>;

  /**
   * Get the Atlas transaction hash from a previously submitted bundle
   * @summary Get the Atlas transaction hash from a previously submitted bundle
   * @param {number} chainId The chain ID
   * @param {string} userOpHash The hash of the user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The Atlas transaction hash
   */
  getBundleHash(
    chainId: number,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<string>;

  _getBundleHash(
    chainId: number,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<string>;

  /**
   * Get the full bundle for a given user operation
   * @summary Get the full bundle for a given user operation
   * @param {number} chainId The chain ID
   * @param {UserOperation} userOp The user operation
   * @param {string[]} hints Hints for solvers
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [extra] Extra parameters
   * @returns {Promise<Bundle>} The full bundle
   */
  getBundleForUserOp(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<Bundle>;

  _getBundleForUserOp(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<Bundle>;
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
  ): Promise<string> {
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
    let userOpHash = await this._submitUserOperation(
      chainId,
      userOp,
      hints,
      extra,
    );

    // Post hooks
    for (const hooksController of this.hooksControllers) {
      [userOp, userOpHash] = await hooksController.postSubmitUserOperation(
        chainId,
        userOp,
        userOpHash,
        extra,
      );
    }

    return userOpHash;
  }

  async getSolverOperations(
    chainId: number,
    userOp: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<SolverOperation[]> {
    // Pre hooks
    for (const hooksController of this.hooksControllers) {
      [userOp, userOpHash, wait, extra] =
        await hooksController.preGetSolverOperations(
          chainId,
          userOp,
          userOpHash,
          wait,
          extra,
        );
    }

    // Implemented by subclass
    let solverOps = await this._getSolverOperations(
      chainId,
      userOp,
      userOpHash,
      wait,
      extra,
    );

    // Post hooks
    for (const hooksController of this.hooksControllers) {
      [userOp, solverOps] = await hooksController.postGetSolverOperations(
        chainId,
        userOp,
        solverOps,
        extra,
      );
    }

    return solverOps;
  }

  async submitBundle(
    chainId: number,
    bundle: Bundle,
    extra?: any,
  ): Promise<string> {
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

  async getBundleHash(
    chainId: number,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<string> {
    // Pre hooks
    for (const hooksController of this.hooksControllers) {
      [userOpHash, wait, extra] = await hooksController.preGetBundleHash(
        chainId,
        userOpHash,
        wait,
        extra,
      );
    }

    // Implemented by subclass
    let atlasTxHash = await this._getBundleHash(
      chainId,
      userOpHash,
      wait,
      extra,
    );

    // Post hooks
    for (const hooksController of this.hooksControllers) {
      atlasTxHash = await hooksController.postGetBundleHash(
        chainId,
        atlasTxHash,
        extra,
      );
    }

    return atlasTxHash;
  }

  async getBundleForUserOp(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<Bundle> {
    // Pre hooks
    for (const hooksController of this.hooksControllers) {
      [userOp, hints, wait, extra] =
        await hooksController.preGetBundleForUserOp(
          chainId,
          userOp,
          hints,
          wait,
          extra,
        );
    }

    // Implemented by subclass
    let bundle = await this._getBundleForUserOp(
      chainId,
      userOp,
      hints,
      wait,
      extra,
    );

    // Post hooks
    for (const hooksController of this.hooksControllers) {
      bundle = await hooksController.postGetBundleForUserOp(
        chainId,
        bundle,
        extra,
      );
    }

    return bundle;
  }

  abstract _submitUserOperation(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    extra?: any,
  ): Promise<string>;

  abstract _getSolverOperations(
    chainId: number,
    userOp: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<SolverOperation[]>;

  abstract _submitBundle(
    chainId: number,
    bundle: Bundle,
    extra?: any,
  ): Promise<string>;

  abstract _getBundleHash(
    chainId: number,
    userOpHash: string,
    wait?: boolean,
    extra?: any,
  ): Promise<string>;

  abstract _getBundleForUserOp(
    chainId: number,
    userOp: UserOperation,
    hints: string[],
    wait?: boolean,
    extra?: any,
  ): Promise<Bundle>;
}
