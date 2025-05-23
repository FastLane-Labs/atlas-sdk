import { BaseOperation, OpField } from "./base";

export class DAppOperation extends BaseOperation {
  protected fields: Map<string, OpField> = new Map([
    ["from", { name: "from", solType: "address"}],
    ["to", { name: "to", solType: "address"}],
    ["nonce", { name: "nonce", solType: "uint256"}],
    ["deadline", { name: "deadline", solType: "uint256"}],
    ["control", { name: "control", solType: "address"}],
    ["bundler", { name: "bundler", solType: "address"}],
    ["userOpHash", { name: "userOpHash", solType: "bytes32"}],
    ["callChainHash", { name: "callChainHash", solType: "bytes32"}],
    ["signature", { name: "signature", solType: "bytes"}],
  ]);

  constructor(is1_5: boolean = false) {
    super("DAppOperation", is1_5);
  }
}
