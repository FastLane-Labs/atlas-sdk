import { ethers } from "ethers";
import {
  UserOperation,
  SolverOperation,
  Bundle,
  OperationBuilder,
  ZeroBytes,
} from "../../operation";
import { BaseHooksController } from "./base";
import { chainConfig } from "../../config";
import atlasAbi from "../../abi/Atlas.json";
import simulatorAbi from "../../abi/Simulator.json";
import multicall3Abi from "../../abi/Multicall3.json";

export class SimulationHooksController extends BaseHooksController {
  private atlas: ethers.Contract;
  private simulator: ethers.Contract;
  private multicall3: ethers.Contract;
  private maxSolutions: number = 10;

  constructor(
    provider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider,
    chainId: number
  ) {
    super(provider, chainId);
    this.atlas = new ethers.Contract(
      chainConfig[chainId].contracts.atlas.address,
      atlasAbi,
      provider
    );
    this.simulator = new ethers.Contract(
      chainConfig[chainId].contracts.simulator.address,
      simulatorAbi,
      provider
    );
    this.multicall3 = new ethers.Contract(
      chainConfig[chainId].contracts.multicall3.address,
      multicall3Abi,
      provider
    );
  }

  async preSubmitUserOperation(
    userOp: UserOperation,
    hints: string[]
  ): Promise<[UserOperation, string[]]> {
    let [success, result, validCallsResult] = await this.simulator
      .getFunction("simUserOperation")
      .staticCall(userOp.toStruct());

    if (!success) {
      throw new Error(
        `user operation failed simulation, result: ${result}, validCallsResult: ${validCallsResult}`
      );
    }

    return [userOp, hints];
  }

  async postGetSolverOperations(
    userOp: UserOperation,
    solverOps: SolverOperation[]
  ): Promise<[UserOperation, SolverOperation[]]> {
    let sortedSolverOps: SolverOperation[] = solverOps.slice();
    const atlasAddress = await this.atlas.getAddress();
    const simulatorAddress = await this.simulator.getAddress();

    // Get scores (multicall)
    let calls = sortedSolverOps.map((solverOp) => {
      return {
        target: atlasAddress,
        allowFailure: true,
        callData: this.atlas.interface.encodeFunctionData("accessData", [
          solverOp.getField("from").value,
        ]),
      };
    });
    let results = await this.multicall3
      .getFunction("aggregate3")
      .staticCall(calls);
    for (let i = 0; i < results.length; i++) {
      if (!results[i].success) {
        console.log("Failed to get stats for solver operation", i);
        continue;
      }
      const stats = this.atlas.interface.decodeFunctionResult(
        "accessData",
        results[i].returnData
      );
      const auctionWins = Number(stats[2]);
      const auctionFails = Number(stats[3]);
      const total = auctionWins + auctionFails;
      sortedSolverOps[i].score = total === 0 ? 0 : (auctionWins * 100) / total;
    }

    // Sort by score
    sortedSolverOps.sort((a, b) => {
      return a.score - b.score;
    });

    // Keep only the best solutions
    sortedSolverOps = sortedSolverOps.slice(0, this.maxSolutions);

    // Simulate (multicall)
    calls = sortedSolverOps.map((solverOp) => {
      return {
        target: simulatorAddress,
        allowFailure: true,
        callData: this.simulator.interface.encodeFunctionData("simSolverCall", [
          userOp.toStruct(),
          solverOp.toStruct(),
          OperationBuilder.newDAppOperation({
            from: ethers.constants.AddressZero,
            to: ethers.constants.AddressZero,
            nonce: 0n,
            deadline: userOp.getField("deadline").value as bigint,
            control: userOp.getField("control").value as string,
            bundler: ethers.constants.AddressZero,
            userOpHash: ethers.constants.HashZero,
            callChainHash: ethers.constants.HashZero,
            signature: ZeroBytes,
          }).toStruct(),
        ]),
      };
    });
    results = await this.multicall3.getFunction("aggregate3").staticCall(calls);
    let simulatedSolverOps: SolverOperation[] = [];
    for (let i = 0; i < results.length; i++) {
      if (!results[i].success) {
        continue;
      }
      const [success, ,] = this.simulator.interface.decodeFunctionResult(
        "simSolverCall",
        results[i].returnData
      );
      if (!success) {
        continue;
      }
      simulatedSolverOps.push(sortedSolverOps[i]);
    }

    return [userOp, simulatedSolverOps];
  }

  async preSubmitBundle(bundleOps: Bundle): Promise<Bundle> {
    // Simulation will throw if the bundle is invalid
    await this.atlas
      .connect(
        new ethers.VoidSigner(
          bundleOps.dAppOperation.getField("bundler").value as string,
          this.provider
        )
      )
      .getFunction("metacall")
      .staticCall(
        bundleOps.userOperation.toStruct(),
        bundleOps.solverOperations.map((solverOp) => solverOp.toStruct()),
        bundleOps.dAppOperation.toStruct()
      );

    return bundleOps;
  }
}
