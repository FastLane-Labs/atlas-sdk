import { BaseOperationRelay } from "./base";
import { OperationBuilder, ZeroBytes } from "../operation/builder";
import { UserOperation, SolverOperation, Bundle } from "../operation";
import { keccak256, ZeroAddress } from "ethers";

export class MockOperationsRelay extends BaseOperationRelay {
  private submittedUserOps: { [key: string]: UserOperation } = {};
  private submittedBundles: { [key: string]: Bundle } = {};

  constructor() {
    super();
  }

  /**
   * Submit a user operation to the relay
   * @summary Submit a user operation to the relay
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
    const userOpHash = keccak256(userOp.abiEncode());
    this.submittedUserOps[userOpHash] = userOp;
    return userOpHash;
  }

  /**
   * Get solver operations for a user operation previously submitted
   * @summary Get solver operations for a user operation previously submitted
   * @param {string} userOpHash The hash of the user operation
   * @param {boolean} [wait] Hold the request until having a response
   * @param {*} [extra] Extra parameters
   * @returns {Promise<SolverOperation[]>} The solver operations
   */
  public async _getSolverOperations(
    userOpHash: string,
    wait?: boolean,
    extra?: any
  ): Promise<SolverOperation[]> {
    const userOp = this.submittedUserOps[userOpHash];
    if (userOp === undefined) {
      throw "User operation not found";
    }

    const solverOps: SolverOperation[] = [];
    for (let i = 0; i < Math.floor(Math.random() * 5 + 1); i++) {
      solverOps.push(
        OperationBuilder.newSolverOperation({
          from: ZeroAddress,
          to: userOp.getField("to").value as string,
          value: 0n,
          gas: BigInt(10000 * (i + 1)),
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
   * Submit user/solvers/dApp operations to the relay for bundling
   * @summary Submit a bundle of user/solvers/dApp operations to the relay
   * @param {Bundle} [bundle] The user/solvers/dApp operations to be bundled
   * @param {*} [extra] Extra parameters
   * @returns {Promise<string>} The result message
   */
  public async _submitBundle(bundle: Bundle, extra?: any): Promise<string> {
    const userOpHash = keccak256(bundle.userOperation.abiEncode());
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
