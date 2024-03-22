import { AbiCoder, keccak256, toUtf8Bytes, TypedDataField } from "ethers";
import {
  validateAddress,
  validateUint256,
  validateBytes32,
  validateBytes,
} from "../utils";

export type OpFieldType = string | bigint;
export type OpField = { name: string; value?: OpFieldType; solType: string };

export abstract class BaseOperation {
  protected fields: Map<string, OpField> = new Map();
  private TYPE_HASH: string = "";
  private abiCoder: AbiCoder;

  constructor() {
    this.abiCoder = new AbiCoder();
  }

  protected setTypeHash(prefix: string) {
    this.TYPE_HASH = keccak256(
      toUtf8Bytes(
        `${prefix}(${Array.from(this.fields.values())
          .map((f) => `${f.solType} ${f.name}`)
          .slice(0, -1)
          .join(",")})`
      )
    );
  }

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

  public validate() {
    this.validateFields();
    this.validateSignature();
  }

  public validateSignature() {
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
    // TODO: validate the actual signature
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

  public proofHash(): string {
    const f = [
      { name: "TYPE_HASH", value: this.TYPE_HASH, solType: "bytes32" },
      ...Array.from(this.fields.values()).slice(0, -1),
    ];

    return keccak256(
      this.abiCoder.encode(
        [`tuple(${f.map((f) => f.solType).join(", ")})`],
        [
          f.map((f) =>
            f.solType !== "bytes" ? f.value : keccak256(f.value as string)
          ),
        ]
      )
    );
  }

  public toStruct(): { [key: string]: OpFieldType } {
    return Array.from(this.fields.values()).reduce(
      (acc, f) => ({ ...acc, [f.name]: f.value }),
      {}
    );
  }

  public toTypedDataTypes(): { [key: string]: TypedDataField[] } {
    const f = [
      { name: "TYPE_HASH", value: this.TYPE_HASH, solType: "bytes32" },
      ...Array.from(this.fields.values()).slice(0, -1),
    ];

    return {
      [this.constructor.name]: f.map((f) => ({
        name: f.name,
        type: f.solType !== "bytes" ? f.solType : "bytes32",
      })),
    };
  }

  public toTypedDataValues(): { [key: string]: OpFieldType } {
    const f = [
      { name: "TYPE_HASH", value: this.TYPE_HASH, solType: "bytes32" },
      ...Array.from(this.fields.values()).slice(0, -1),
    ];

    return f.reduce(
      (acc, f) => ({
        ...acc,
        [f.name]:
          f.solType !== "bytes" ? f.value : keccak256(f.value as string),
      }),
      {}
    );
  }
}
