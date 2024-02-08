import { Contract } from "@ethersproject/contracts";
import { Web3Provider } from "@ethersproject/providers";
import { AddressZero } from "@ethersproject/constants";
import { AbiCoder, keccak256, solidityPack } from "ethers/lib/utils";
import { Wallet } from "ethers";
import { UserOperation, SolverOperation, DAppOperation } from "./operation";
import { atlasAddress, atlasVerificationAddress } from "./address";
import atlasVerificationAbi from "./abi/AtlasVerification.json";
import dAppControlAbi from "./abi/DAppControl.json";

const DAPP_TYPE_HASH = keccak256(
  "DAppApproval(address from,address to,uint256 value,uint256 gas,uint256 maxFeePerGas,uint256 nonce,uint256 deadline,address control,address bundler,bytes32 userOpHash,bytes32 callChainHash)"
);

/**
 * Represents a dApp, and has methods for helping build dApp operations.
 */
export class DApp {
  atlasVerification: Contract;
  dAppControl: Contract;
  chainId: number;
  abiCoder: AbiCoder;

  /**
   * Creates a new dApp.
   * @param chainId the chain ID of the network
   */
  constructor(provider: Web3Provider, chainId: number) {
    this.atlasVerification = new Contract(
      atlasVerificationAddress[chainId],
      atlasVerificationAbi,
      provider
    );
    this.dAppControl = new Contract("", dAppControlAbi, provider);
    this.chainId = chainId;
    this.abiCoder = new AbiCoder();
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
    sessionAccount: Wallet
  ): Promise<DAppOperation> {
    const dAppOp: DAppOperation = {
      from: sessionAccount.publicKey,
      to: atlasAddress[this.chainId],
      value: "0",
      gas: "0",
      maxFeePerGas: userOp.maxFeePerGas,
      nonce: "0",
      deadline: userOp.deadline,
      control: userOp.control,
      bundler: AddressZero,
      userOpHash: keccak256(this.abiEncodeUserOperation(userOp)),
      callChainHash: await this.getCallChainHash(userOp, solverOps),
      signature: "",
    };

    dAppOp.signature = await this.signDAppOperation(dAppOp, sessionAccount);
    return dAppOp;
  }

  /**
   * Get a user operation structure abi encoded.
   * @param userOp a user operation
   * @returns the user operation abi encoded
   */
  public abiEncodeUserOperation(userOp: UserOperation): string {
    return this.abiCoder.encode(
      [
        "address",
        "address",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "address",
        "address",
        "address",
        "bytes",
        "bytes",
      ],
      [
        userOp.from,
        userOp.to,
        userOp.value,
        userOp.gas,
        userOp.maxFeePerGas,
        userOp.nonce,
        userOp.deadline,
        userOp.dapp,
        userOp.control,
        userOp.sessionKey,
        userOp.data,
        userOp.signature,
      ]
    );
  }

  /**
   * Get a solver operation structure abi encoded.
   * @param userOp a solver operation
   * @returns the solver operation abi encoded
   */
  public abiEncodeSolverOperation(solverOp: SolverOperation): string {
    return this.abiCoder.encode(
      [
        "address",
        "address",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "address",
        "address",
        "bytes32",
        "address",
        "uint256",
        "bytes",
        "bytes",
      ],
      [
        solverOp.from,
        solverOp.to,
        solverOp.value,
        solverOp.gas,
        solverOp.maxFeePerGas,
        solverOp.deadline,
        solverOp.solver,
        solverOp.control,
        solverOp.userOpHash,
        solverOp.bidToken,
        solverOp.bidAmount,
        solverOp.data,
        solverOp.signature,
      ]
    );
  }

  /**
   * Get the call chain hash.
   * @param userOp a signed user operation
   * @param solverOps an array of signed solver operations
   * @returns a call chain hash
   */
  public async getCallChainHash(
    userOp: UserOperation,
    solverOps: SolverOperation[]
  ): Promise<string> {
    const dConfig = await this.dAppControl
      .attach(userOp.control)
      .getDAppConfig(userOp);

    let callSequenceHash = "";
    let counter = 0;

    if ((dConfig.callConfig & 4) !== 0) {
      // Require preOps
      callSequenceHash = keccak256(
        solidityPack(
          ["bytes32", "address", "bytes", "uint256"],
          [
            callSequenceHash,
            dConfig.to,
            this.dAppControl.interface.encodeFunctionData("preOpsCall", [
              userOp,
            ]),
            counter++,
          ]
        )
      );
    }

    // User call
    callSequenceHash = keccak256(
      solidityPack(
        ["bytes32", "bytes", "uint256"],
        [callSequenceHash, this.abiEncodeUserOperation(userOp), counter++]
      )
    );

    // Solver calls
    for (const solverOp of solverOps) {
      callSequenceHash = keccak256(
        solidityPack(
          ["bytes32", "bytes", "uint256"],
          [callSequenceHash, this.abiEncodeSolverOperation(solverOp), counter++]
        )
      );
    }

    return callSequenceHash;
  }

  /**
   * Sign a dApp operation.
   * @param dAppOpp a dApp operation
   * @param sessionAccount the session key used to signed the dApp operation
   * @returns the signature
   */
  public async signDAppOperation(
    dAppOp: DAppOperation,
    sessionAccount: Wallet
  ): Promise<string> {
    const proofHash: string = keccak256(
      this.abiCoder.encode(
        [
          "bytes32",
          "address",
          "address",
          "uint256",
          "uint256",
          "uint256",
          "uint256",
          "uint256",
          "address",
          "bytes32",
          "bytes32",
        ],
        [
          DAPP_TYPE_HASH,
          dAppOp.from,
          dAppOp.to,
          dAppOp.value,
          dAppOp.gas,
          dAppOp.maxFeePerGas,
          dAppOp.nonce,
          dAppOp.deadline,
          dAppOp.control,
          dAppOp.userOpHash,
          dAppOp.callChainHash,
        ]
      )
    );

    const atlasDomainSeparator: string =
      await this.atlasVerification.getDomainSeparator();

    const messageHash: string = keccak256(
      this.abiCoder.encode(
        ["bytes32", "bytes32"],
        [atlasDomainSeparator, proofHash]
      )
    );

    const signature = await sessionAccount.signMessage(messageHash);
    return signature;
  }
}
