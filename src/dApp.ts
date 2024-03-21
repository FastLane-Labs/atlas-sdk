import {
  BrowserProvider,
  Contract,
  HDNodeWallet,
  ZeroAddress,
  AbiCoder,
  keccak256,
  toUtf8Bytes,
} from "ethers";
import { UserOperation, SolverOperation, DAppOperation } from "./operation";
import { atlasAddress, atlasVerificationAddress } from "./address";
import { abiEncodeUserOperation, getCallChainHash, signEip712 } from "./utils";
import atlasVerificationAbi from "./abi/AtlasVerification.json";
import dAppControlAbi from "./abi/DAppControl.json";

const DAPP_TYPE_HASH = keccak256(
  toUtf8Bytes(
    "DAppApproval(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint256 deadline,address control,address bundler,bytes32 userOpHash,bytes32 callChainHash)"
  )
);

/**
 * Represents a dApp, and has methods for helping build dApp operations.
 */
export class DApp {
  private chainId: number;
  private atlasVerification: Contract;
  private dAppControl: Contract;

  /**
   * Creates a new dApp.
   * @param chainId the chain ID of the network
   */
  constructor(provider: BrowserProvider, chainId: number) {
    this.chainId = chainId;
    this.atlasVerification = new Contract(
      atlasVerificationAddress[chainId],
      atlasVerificationAbi,
      provider
    );
    this.dAppControl = new Contract(ZeroAddress, dAppControlAbi, provider);
  }

  /**
   * Creates a dApp operation.
   * @param userOp a signed user operation
   * @param solverOps an array of solver operations
   * @param sessionAccount the session key used to signed the dApp operation
   * @returns a signed dApp operation
   */
  public async createDAppOperation(
    userOp: UserOperation,
    solverOps: SolverOperation[],
    sessionAccount: HDNodeWallet
  ): Promise<DAppOperation> {
    const dConfig = await this.dAppControl
      .attach(userOp.control)
      .getFunction("getDAppConfig")
      .staticCall(userOp.control);

    const dAppOp: DAppOperation = {
      from: sessionAccount.publicKey,
      to: atlasAddress[this.chainId],
      value: "0",
      gas: "0",
      nonce: "0",
      deadline: userOp.deadline,
      control: userOp.control,
      bundler: ZeroAddress,
      userOpHash: keccak256(abiEncodeUserOperation(userOp)),
      callChainHash: getCallChainHash(
        dConfig.callConfig,
        dConfig.to,
        userOp,
        solverOps
      ),
      signature: "",
    };

    dAppOp.signature = await this.signDAppOperation(dAppOp, sessionAccount);
    return dAppOp;
  }

  /**
   * Sign a dApp operation.
   * @param dAppOpp a dApp operation
   * @param sessionAccount the session key used to signed the dApp operation
   * @returns the signature
   */
  public async signDAppOperation(
    dAppOp: DAppOperation,
    sessionAccount: HDNodeWallet
  ): Promise<string> {
    const atlasDomainSeparator: string =
      await this.atlasVerification.getDomainSeparator();

    return signEip712(
      atlasDomainSeparator,
      getDAppOperationProofHash(dAppOp),
      sessionAccount
    );
  }
}

export function getDAppOperationProofHash(dAppOp: DAppOperation): string {
  return keccak256(
    new AbiCoder().encode(
      [
        "tuple(bytes32, address, address, uint256, uint256, uint256, uint256, address, bytes32, bytes32)",
      ],
      [
        [
          DAPP_TYPE_HASH,
          dAppOp.from,
          dAppOp.to,
          dAppOp.value,
          dAppOp.gas,
          dAppOp.nonce,
          dAppOp.deadline,
          dAppOp.control,
          dAppOp.userOpHash,
          dAppOp.callChainHash,
        ],
      ]
    )
  );
}
