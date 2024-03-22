export type UserOperationParams = {
  from: string; // address
  destination: string; // address
  gas: bigint; // uint256
  maxFeePerGas: bigint; // uint256
  value: bigint; // uint256
  deadline: bigint; // uint256
  data: string; // bytes
  dAppControl: string; // address
};

export type UserOperation = {
  from: string; // address
  to: string; // address
  value: bigint; // uint256
  gas: bigint; // uint256
  maxFeePerGas: bigint; // uint256
  nonce: bigint; // uint256
  deadline: bigint; // uint256
  dapp: string; // address
  control: string; // address
  sessionKey: string; // address
  data: string; // bytes
  signature: string; // bytes
};

export type SolverOperation = {
  from: string; // address
  to: string; // address
  value: bigint; // uint256
  gas: bigint; // uint256
  maxFeePerGas: bigint; // uint256
  deadline: bigint; // uint256
  solver: string; // address
  control: string; // address
  userOpHash: string; // bytes32
  bidToken: string; // address
  bidAmount: bigint; // uint256
  data: string; // bytes
  signature: string; // bytes
};

export type SolverOperations = SolverOperation[];

export type DAppOperation = {
  from: string; // address
  to: string; // address
  value: bigint; // uint256
  gas: bigint; // uint256
  nonce: bigint; // uint256
  deadline: bigint; // uint256
  control: string; // address
  bundler: string; // address
  userOpHash: string; // bytes32
  callChainHash: string; // bytes32
  signature: string; // bytes
};

export interface Bundle {
  userOperation: UserOperation;
  solverOperations: SolverOperations;
  dAppOperation: DAppOperation;
}
