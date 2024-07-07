import { ethers } from "ethers";
import {
  validateAddress,
  validateUint32,
  validateUint256,
  validateBytes32,
  validateBytes,
} from "../utils";

export type OpFieldType = string | bigint;
export type OpField = { name: string; value?: OpFieldType; solType: string };

export abstract class BaseOperation {
  protected fields: Map<string, OpField> = new Map();
  protected abiCoder = new ethers.utils.AbiCoder();

  public setFields(fields: { [key: string]: OpFieldType }) {
    Object.entries(fields).forEach(([name, value]) => {
      this.setField(name, value);
    });
  }

  public setField(name: string, value: OpFieldType) {
    const f = this.fields.get(name);
    if (f === undefined) {
      throw new Error(`Field ${name} does not exist`);
    }
    f.value = value;
    this.validateField(f);
  }

  public getField(name: string): OpField {
    const f = this.fields.get(name);
    if (f === undefined) {
      throw new Error(`Field ${name} does not exist`);
    }
    return f;
  }

  public validate(tdDomain: ethers.TypedDataDomain) {
    this.validateFields();
    this.validateSignature(tdDomain);
  }

  public validateSignature(tdDomain: ethers.TypedDataDomain) {
    const f = this.fields.get("signature");
    if (f === undefined) {
      throw new Error("Field signature does not exist");
    }
    if (f.value === undefined) {
      throw new Error("Field signature is not set");
    }
    if (!validateBytes(f.value as string)) {
      throw new Error("Field signature is not a valid bytes");
    }
    const signer = ethers.utils.verifyTypedData(
      tdDomain,
      this.toTypedDataTypes(),
      this.toTypedDataValues(),
      f.value as string
    );
    if (signer !== this.getField("from").value) {
      throw new Error("Invalid signature");
    }
  }

  public validateFields() {
    Array.from(this.fields.values()).forEach((f) => {
      this.validateField(f);
    });
  }

  public validateField(f: OpField) {
    if (f.value === undefined) {
      throw new Error(`Field ${f.name} is not set`);
    }
    switch (f.solType) {
      case "address":
        if (!validateAddress(f.value as string)) {
          throw new Error(`Field ${f.name} is not a valid address`);
        }
        break;
      case "uint32":
        if (!validateUint32(f.value as bigint)) {
          throw new Error(`Field ${f.name} is not a valid uint32`);
        }
        break;
      case "uint256":
        if (!validateUint256(f.value as bigint)) {
          throw new Error(`Field ${f.name} is not a valid uint256`);
        }
        break;
      case "bytes32":
        if (!validateBytes32(f.value as string)) {
          throw new Error(`Field ${f.name} is not a valid bytes32`);
        }
        break;
      case "bytes":
        if (!validateBytes(f.value as string)) {
          throw new Error(`Field ${f.name} is not a valid bytes`);
        }
        break;
      default:
        throw new Error(`Field ${f.name} has unknown type ${f.solType}`);
    }
  }

  public abiEncode(): string {
    const f = Array.from(this.fields.values());
    return this.abiCoder.encode(
      [`tuple(${f.map((f) => f.solType).join(", ")})`],
      [f.map((f) => f.value)]
    );
  }

  public toStruct(): { [key: string]: OpFieldType } {
    return Array.from(this.fields.values()).reduce(
      (acc, f) => ({ ...acc, [f.name]: f.value }),
      {}
    );
  }

  public toTypedDataTypes(): { [key: string]: ethers.TypedDataField[] } {
    return this.toTypedDataTypesCustomFields(
      // All fields except the last one (signature)
      Array.from(this.fields.keys()).slice(0, -1)
    );
  }

  public toTypedDataTypesCustomFields(fields: string[]): {
    [key: string]: ethers.TypedDataField[];
  } {
    return {
      [this.constructor.name]: fields
        .map((f) => this.fields.get(f) as OpField)
        .map((f) => ({
          name: f.name,
          type: f.solType,
        })),
    };
  }

  public toTypedDataValues(): { [key: string]: OpFieldType } {
    return this.toTypedDataValuesCustomFields(
      // All fields except the last one (signature)
      Array.from(this.fields.keys()).slice(0, -1)
    );
  }

  public toTypedDataValuesCustomFields(fields: string[]): {
    [key: string]: OpFieldType;
  } {
    return fields
      .map((f) => this.fields.get(f) as OpField)
      .reduce(
        (acc, f) => ({
          ...acc,
          [f.name]: f.value,
        }),
        {}
      );
  }
}
