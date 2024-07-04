import { BaseOperation, OpField } from "./base";

export class SolverOperation extends BaseOperation {
  protected fields: Map<string, OpField> = new Map([
    ["from", { name: "from", solType: "address" }],
    ["to", { name: "to", solType: "address" }],
    ["value", { name: "value", solType: "uint256" }],
    ["gas", { name: "gas", solType: "uint256" }],
    ["maxFeePerGas", { name: "maxFeePerGas", solType: "uint256" }],
    ["deadline", { name: "deadline", solType: "uint256" }],
    ["solver", { name: "solver", solType: "address" }],
    ["control", { name: "control", solType: "address" }],
    ["userOpHash", { name: "userOpHash", solType: "bytes32" }],
    ["bidToken", { name: "bidToken", solType: "address" }],
    ["bidAmount", { name: "bidAmount", solType: "uint256" }],
    ["data", { name: "data", solType: "bytes" }],
    ["signature", { name: "signature", solType: "bytes" }],
  ]);

  public score: number;

  constructor(score?: number) {
    super();
    this.score = score || 0;
  }
}
