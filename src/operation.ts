export type UserOperation = {
  from: string;
  to: string;
  value: string;
  gas: string;
  maxFeePerGas: string;
  nonce: string;
  deadline: string;
  dapp: string;
  control: string;
  sessionKey: string;
  data: string;
  signature: string;
};

export type SolverOperation = {
  from: string;
  to: string;
  value: string;
  gas: string;
  maxFeePerGas: string;
  deadline: string;
  solver: string;
  control: string;
  userOpHash: string;
  bidToken: string;
  bidAmount: string;
  data: string;
  signature: string;
};

export type DAppOperation = {
  from: string;
  to: string;
  value: string;
  gas: string;
  maxFeePerGas: string;
  nonce: string;
  deadline: string;
  control: string;
  bundler: string;
  userOpHash: string;
  callChainHash: string;
  signature: string;
};
