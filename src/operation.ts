export type UserOperation = {
  from: string; // address
  to: string; // address
  value: string; // uint256
  gas: string; // uint256
  maxFeePerGas: string; // uint256
  nonce: string; // uint256
  deadline: string; // uint256
  dapp: string; // address
  control: string; // address
  sessionKey: string; // address
  data: string; // bytes
  signature: string; // bytes
};

export type SolverOperation = {
  from: string; // address
  to: string; // address
  value: string; // uint256
  gas: string; // uint256
  maxFeePerGas: string; // uint256
  deadline: string; // uint256
  solver: string; // address
  control: string; // address
  userOpHash: string; // bytes32
  bidToken: string; // address
  bidAmount: string; // uint256
  data: string; // bytes
  signature: string; // bytes
};

export type DAppOperation = {
  from: string; // address
  to: string; // address
  value: string; // uint256
  gas: string; // uint256
  maxFeePerGas: string; // uint256
  nonce: string; // uint256
  deadline: string; // uint256
  control: string; // address
  bundler: string; // address
  userOpHash: string; // bytes32
  callChainHash: string; // bytes32
  signature: string; // bytes
};
