import { BaseBackend } from "./base";
import { UserOperation, Bundle } from "../operation";
import { flagTrustedOpHash } from "../utils";
import { AtlasVersion, chainConfig } from "../config";

export class MockBackend extends BaseBackend {
  private submittedBundles: { [key: string]: Bundle } = {};

  constructor(params: { [k: string]: string } = {}) {
    super(params);
  }

  private async generateUserOpHash(
    chainId: number,
    atlasVersion: AtlasVersion,
    userOp: UserOperation,
  ): Promise<string> {
    return userOp.hash(
      (await chainConfig(chainId, atlasVersion)).eip712Domain,
      flagTrustedOpHash(userOp.callConfig()),
    );
  }

  /**
   * Submit a user operation to the backend
   * @summary Submit a user operation to the backend
   * @param {number} chainId the chain ID of the network
   * @param {AtlasVersion} atlasVersion the version of the Atlas protocol
   * @param {UserOperation} [userOp] The user operation
   * @param {string[]} [hints] Hints for solvers
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string[] | Bundle>} The hashes of the metacall or the full bundle
   */
  public async _submitUserOperation(
    chainId: number,
    atlasVersion: AtlasVersion,
    userOp: UserOperation,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hints: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extra?: any,
  ): Promise<string[]> {
    const userOpHash = await this.generateUserOpHash(chainId, atlasVersion, userOp);
    return [userOpHash];
  }

  /**
   * Submit user/solvers/dApp operations to the backend for bundling
   * @summary Submit a bundle of user/solvers/dApp operations to the backend
   * @param {number} chainId the chain ID of the network
   * @param {AtlasVersion} atlasVersion the version of the Atlas protocol
   * @param {Bundle} [bundle] The user/solvers/dApp operations to be bundled
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string[]>} The hashes of the metacall
   */
  public async _submitBundle(
    chainId: number,
    atlasVersion: AtlasVersion,
    bundle: Bundle,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    extra?: any,
  ): Promise<string[]> {
    const userOpHash = await this.generateUserOpHash(
      chainId,
      atlasVersion,
      bundle.userOperation,
    );
    this.submittedBundles[userOpHash] = bundle;
    return [userOpHash];
  }
}
