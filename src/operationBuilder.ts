import { Contract } from "@ethersproject/contracts";
import { Web3Provider } from "@ethersproject/providers";
import { UserOperation } from "./operation";
import { atlasAddress, atlasVerificationAddress } from "./address";
import atlasVerificationAbi from "./abi/AtlasVerification.json";
import dAppControlAbi from "./abi/DAppControl.json";

export type UserOperationParams = {
  from: string;
  destination: string;
  gas: string;
  maxFeePerGas: string;
  value: string;
  deadline: string;
  data: string;
  dAppControl: string;
};

/**
 * Offers helper methods to build user operations.
 */
export abstract class OperationBuilder {
  private chainId: number;
  private atlasVerification: Contract;
  private dAppControl: Contract;

  constructor(provider: Web3Provider, chainId: number) {
    this.chainId = chainId;
    this.atlasVerification = new Contract(
      atlasVerificationAddress[chainId],
      atlasVerificationAbi,
      provider
    );
    this.dAppControl = new Contract("", dAppControlAbi, provider);
  }

  /**
   * Builds an unsigned user operation.
   * @param userOperationParams the parameters to build the user operation
   * @returns an unsigned user operation
   */
  public async buildUserOperation(
    userOperationParams: UserOperationParams
  ): Promise<UserOperation> {
    const requireSequencedUserNonces: boolean = await this.dAppControl
      .attach(userOperationParams.dAppControl)
      .requireSequencedUserNonces();

    const nonce: string = await this.atlasVerification.getNextNonce(
      userOperationParams.from,
      requireSequencedUserNonces
    );

    return {
      from: userOperationParams.from,
      to: atlasAddress[this.chainId],
      value: userOperationParams.value,
      gas: userOperationParams.gas,
      maxFeePerGas: userOperationParams.maxFeePerGas,
      nonce: nonce,
      deadline: userOperationParams.deadline,
      dapp: userOperationParams.destination,
      control: userOperationParams.dAppControl,
      sessionKey: "",
      data: userOperationParams.data,
      signature: "",
    };
  }
}
