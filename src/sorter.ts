import { Contract } from "@ethersproject/contracts";
import { Web3Provider } from "@ethersproject/providers";
import { UserOperation, SolverOperation } from "./operation";
import { atlasSorterAddress } from "./address";
import sorterAbi from "./abi/Sorter.json";

/**
 * Represents an Atlas sorter, and has methods for helping sort solver operations.
 */
export class Sorter {
  chainId: number;
  contract: Contract;

  /**
   * Creates a new Atlas sorter.
   * @param provider a Web3 provider
   * @param chainId the chain ID of the network
   */
  constructor(provider: Web3Provider, chainId: number) {
    this.chainId = chainId;
    this.contract = new Contract(
      atlasSorterAddress[chainId],
      sorterAbi,
      provider
    );
  }

  /**
   * Sort an array of solver operations and filter out invalid ones as per the dApp control requirements.
   * @param userOp a user operation
   * @param solverOps an array of solver operations
   * @returns a sorted array of solver operations
   */
  public async sortSolverOperations(
    userOp: UserOperation,
    solverOps: SolverOperation[]
  ): Promise<SolverOperation[]> {
    const sortedSolverOps: SolverOperation[] = await this.contract.sortBids(
      userOp,
      solverOps
    );
    return sortedSolverOps;
  }
}
