import { keccak256, ZeroAddress } from "ethers";
import { BaseBackend } from "./base";
import { OperationBuilder, ZeroBytes } from "../operation/builder";
import { UserOperation, SolverOperation, Bundle } from "../operation";
import { flagTrustedOpHash } from "../utils";
import { chainConfig } from "../config";

export class MockBackend extends BaseBackend {
  private submittedBundles: { [key: string]: Bundle } = {};

  constructor(params: { [k: string]: string } = {}) {
    super(params);
  }

  private generateUserOpHash(chainId: number, userOp: UserOperation): string {
    return userOp.hash(
      chainConfig[chainId].eip712Domain,
      flagTrustedOpHash(userOp.callConfig()),
    );
  }

  /**
   * Submit a user operation to the backend
   * @summary Submit a user operation to the backend
   * @param {UserOperation} [userOp] The user operation
   * @param {string[]} [hints] Hints for solvers
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string[] | Bundle>} The hashes of the metacall or the full bundle
   */
  public async _submitUserOperation(
    chainId: number,
    userOp: UserOperation,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hints: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extra?: any,
  ): Promise<string[]> {
    const userOpHash = this.generateUserOpHash(chainId, userOp);
    return [userOpHash];
  }

  /**
   * Submit user/solvers/dApp operations to the backend for bundling
   * @summary Submit a bundle of user/solvers/dApp operations to the backend
   * @param {Bundle} [bundle] The user/solvers/dApp operations to be bundled
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string[]>} The hashes of the metacall
   */
  public async _submitBundle(
    chainId: number,
    bundle: Bundle,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extra?: any,
  ): Promise<string[]> {
    const userOpHash = this.generateUserOpHash(chainId, bundle.userOperation);
    this.submittedBundles[userOpHash] = bundle;
    return [userOpHash];
  }
}
