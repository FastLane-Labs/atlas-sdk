import { TypedDataEncoder, TypedDataDomain, TypedDataField } from "ethers";
import { BaseOperation, OpField } from "./base";
import { AtlasVersion, AtlasLatestVersion, isVersionAtLeast } from "../config";

export class UserOperation extends BaseOperation {
  protected fields: Map<string, OpField> = new Map([
    ["from", { name: "from", solType: "address"}],
    ["to", { name: "to", solType: "address"}],
    ["value", { name: "value", solType: "uint256"}],
    ["gas", { name: "gas", solType: "uint256"}],
    ["maxFeePerGas", { name: "maxFeePerGas", solType: "uint256"}],
    ["nonce", { name: "nonce", solType: "uint256"}],
    ["deadline", { name: "deadline", solType: "uint256"}],
    ["dapp", { name: "dapp", solType: "address"}],
    ["control", { name: "control", solType: "address"}],
    ["callConfig", { name: "callConfig", solType: "uint32"}],
    ["dappGasLimit", { name: "dappGasLimit", solType: "uint32", fromVersion: "1.5" }],
    ["solverGasLimit", { name: "solverGasLimit", solType: "uint32", fromVersion: "1.6" }],
    ["bundlerSurchargeRate", { name: "bundlerSurchargeRate", solType: "uint24", fromVersion: "1.6" }],
    ["sessionKey", { name: "sessionKey", solType: "address"}],
    ["data", { name: "data", solType: "bytes"}],
    ["signature", { name: "signature", solType: "bytes"}],
  ]);

  private trustedOperationHashFields = [
    "from",
    "to",
    "dapp",
    "control",
    "callConfig",
    "sessionKey",
  ];

  private trustedOperationHashFields1_5 = [
    "from",
    "to",
    "dapp",
    "control",
    "callConfig",
    "dappGasLimit",
    "sessionKey",
  ];

  private trustedOperationHashFields1_6 = [
    "from",
    "to",
    "dapp",
    "control",
    "callConfig",
    "dappGasLimit",
    "solverGasLimit",
    "bundlerSurchargeRate",
    "sessionKey",
  ];

  constructor(atlasVersion: AtlasVersion = AtlasLatestVersion) {
    super("UserOperation", atlasVersion);
  }

  public hash(eip712Domain: TypedDataDomain, trusted: boolean): string {
    let typedDataTypes: Record<string, TypedDataField[]>;
    let typedDataValues: Record<string, any>;

    if (trusted) {
      if (isVersionAtLeast(this.atlasVersion, "1.6")) {
        typedDataTypes = this.toTypedDataTypesCustomFields(this.trustedOperationHashFields1_6);
        typedDataValues = this.toTypedDataValuesCustomFields(this.trustedOperationHashFields1_6);
      } else if (isVersionAtLeast(this.atlasVersion, "1.5")) {
        typedDataTypes = this.toTypedDataTypesCustomFields(this.trustedOperationHashFields1_5);
        typedDataValues = this.toTypedDataValuesCustomFields(this.trustedOperationHashFields1_5);
      } else {
        typedDataTypes = this.toTypedDataTypesCustomFields(this.trustedOperationHashFields);
        typedDataValues = this.toTypedDataValuesCustomFields(this.trustedOperationHashFields);
      }
    } else {
      typedDataTypes = this.toTypedDataTypes();
      typedDataValues = this.toTypedDataValues();
    }

    return TypedDataEncoder.hash(eip712Domain, typedDataTypes, typedDataValues);
  }

  public callConfig(): number {
    const callConfig = this.getField("callConfig").value as bigint;
    return Number(callConfig);
  }
}

export interface UserOperationParams {
  from: string;
  to?: string;
  value: bigint;
  gas: bigint;
  maxFeePerGas: bigint;
  nonce?: bigint;
  deadline: bigint;
  dapp: string;
  control: string;
  callConfig?: bigint;
  dappGasLimit?: bigint; // From Atlas v1.5
  solverGasLimit?: bigint; // From Atlas v1.6
  bundlerSurchargeRate?: bigint; // From Atlas v1.6
  sessionKey?: string;
  data: string;
  signature?: string;
}
