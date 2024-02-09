import { Contract } from "@ethersproject/contracts";
import { Web3Provider } from "@ethersproject/providers";
import { UserOperation } from "./operation";
import { atlasAddress, atlasVerificationAddress } from "./address";
import atlasVerificationAbi from "./abi/AtlasVerification.json";
import dAppControlAbi from "./abi/DAppControl.json";

/**
 * Offers helper methods to build user operations.
 */
export abstract class OperationBuilder {
  atlasVerification: Contract;
  dAppControl: Contract;
  chainId: number;

  constructor(provider: Web3Provider, chainId: number) {
    this.atlasVerification = new Contract(
      atlasVerificationAddress[chainId],
      atlasVerificationAbi,
      provider
    );
    this.dAppControl = new Contract("", dAppControlAbi, provider);
    this.chainId = chainId;
  }

  /**
   * Builds an unsigned user operation.
   * @param from the address of the user
   * @param destination the address of the user transaction destination
   * @param gas the gas limit for the user transaction
   * @param maxFeePerGas the maximum fee per gas for the user transaction
   * @param value the value of the user transaction
   * @param deadline the deadline for the user transaction (block number)
   * @param data the data of the user transaction
   * @param dAppControl the address of the dApp control contract
   * @returns an unsigned user operation
   */
  public async buildUserOperation(
    from: string,
    destination: string,
    gas: string,
    maxFeePerGas: string,
    value: string,
    deadline: string,
    data: string,
    dAppControl: string
  ): Promise<UserOperation> {
    const requireSequencedUserNonces: boolean = await this.dAppControl
      .attach(dAppControl)
      .requireSequencedUserNonces();

    const nonce: string = await this.atlasVerification.getNextNonce(
      from,
      requireSequencedUserNonces
    );

    return {
      from: from,
      to: atlasAddress[this.chainId],
      value: value,
      gas: gas,
      maxFeePerGas: maxFeePerGas,
      nonce: nonce,
      deadline: deadline,
      dapp: destination,
      control: dAppControl,
      sessionKey: "",
      data: data,
      signature: "",
    };
  }
}
