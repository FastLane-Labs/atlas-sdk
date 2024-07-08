import { keccak256, ZeroAddress } from "ethers";
import { BaseBackend } from "./base";
import { OperationBuilder, ZeroBytes } from "../operation/builder";
import { UserOperation, SolverOperation, Bundle } from "../operation";
import { flagTrustedOpHash } from "../utils";
import { chainConfig } from "../config";

const chainId = 11155111;

export class MockBackend extends BaseBackend {
  private submittedBundles: { [key: string]: Bundle } = {};

  constructor() {
    super();
  }

  /**
   * Submit a user operation to the backend
   * @summary Submit a user operation to the backend
   * @param {UserOperation} [userOp] The user operation
   * @param {string[]} [hints] Hints for solvers
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The hash of the user operation
   */
  public async _submitUserOperation(
    userOp: UserOperation,
    hints: string[],
    extra?: any
  ): Promise<string> {
    return userOp.hash(
      chainConfig[chainId].eip712Domain,
      flagTrustedOpHash(userOp.callConfig())
    );
  }

  /**
   * Get solver operations for a user operation previously submitted
   * @summary Get solver operations for a user operation previously submitted
   * @param {UserOperation} userOp The user operation
   * @param {string} userOpHash The hash of the user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [extra] Extra parameters
   * @returns {Promise<SolverOperation[]>} The solver operations
   */
  public async _getSolverOperations(
    userOp: UserOperation,
    userOpHash: string,
    wait?: boolean,
    extra?: any
  ): Promise<SolverOperation[]> {
    const solverOps: SolverOperation[] = [];
    for (let i = 0; i < Math.floor(Math.random() * 5 + 1); i++) {
      solverOps.push(
        OperationBuilder.newSolverOperation({
          from: ZeroAddress,
          to: userOp.getField("to").value as string,
          value: 0n,
          gas: userOp.getField("gas").value as bigint,
          maxFeePerGas: userOp.getField("maxFeePerGas").value as bigint,
          deadline: userOp.getField("deadline").value as bigint,
          solver: ZeroAddress,
          control: userOp.getField("control").value as string,
          userOpHash: userOpHash,
          bidToken: ZeroAddress,
          bidAmount: BigInt(30000 * (i + 1)),
          data: ZeroBytes,
          signature: ZeroBytes,
        })
      );
    }

    return solverOps;
  }

  /**
   * Submit user/solvers/dApp operations to the backend for bundling
   * @summary Submit a bundle of user/solvers/dApp operations to the backend
   * @param {Bundle} [bundle] The user/solvers/dApp operations to be bundled
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The result message
   */
  public async _submitBundle(bundle: Bundle, extra?: any): Promise<string> {
    const userOpHash = bundle.userOperation.hash(
      chainConfig[chainId].eip712Domain,
      flagTrustedOpHash(bundle.userOperation.callConfig())
    );
    this.submittedBundles[userOpHash] = bundle;
    return userOpHash;
  }

  /**
   * Get the Atlas transaction hash from a previously submitted bundle
   * @summary Get the Atlas transaction hash from a previously submitted bundle
   * @param {string} userOpHash The hash of the user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The Atlas transaction hash
   */
  public async _getBundleHash(
    userOpHash: string,
    wait?: boolean,
    extra?: any
  ): Promise<string> {
    const bundle = this.submittedBundles[userOpHash];
    if (bundle === undefined) {
      throw "Bundle not found";
    }

    // Simulate a random transaction hash
    return keccak256(bundle.dAppOperation.abiEncode());
  }
}
