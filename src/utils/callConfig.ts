enum CallConfigIndex {
  UserNoncesSequential,
  DAppNoncesSequential,
  RequirePreOps,
  TrackPreOpsReturnData,
  TrackUserReturnData,
  DelegateUser,
  PreSolver,
  PostSolver,
  RequirePostOpsCall,
  ZeroSolvers,
  ReuseUserOp,
  UserAuctioneer,
  SolverAuctioneer,
  UnknownAuctioneer,
  VerifyCallChainHash,
  ForwardReturnData,
  RequireFulfillment,
  TrustedOpHash,
  InvertBidValue,
  ExPostBids,
  AllowAllocateValueFailure,
}

export function flagUserNoncesSequential(callConfig: number): boolean {
  return (
    (Number(callConfig) & (1 << CallConfigIndex.UserNoncesSequential)) != 0
  );
}

export function flagDAppNoncesSequential(callConfig: number): boolean {
  return (
    (Number(callConfig) & (1 << CallConfigIndex.DAppNoncesSequential)) != 0
  );
}

export function flagRequirePreOps(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.RequirePreOps)) != 0;
}

export function flagTrackPreOpsReturnData(callConfig: number): boolean {
  return (
    (Number(callConfig) & (1 << CallConfigIndex.TrackPreOpsReturnData)) != 0
  );
}

export function flagTrackUserReturnData(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.TrackUserReturnData)) != 0;
}

export function flagDelegateUser(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.DelegateUser)) != 0;
}

export function flagPreSolver(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.PreSolver)) != 0;
}

export function flagPostSolver(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.PostSolver)) != 0;
}

export function flagRequirePostOpsCall(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.RequirePostOpsCall)) != 0;
}

export function flagZeroSolvers(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.ZeroSolvers)) != 0;
}

export function flagReuseUserOp(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.ReuseUserOp)) != 0;
}

export function flagUserAuctioneer(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.UserAuctioneer)) != 0;
}

export function flagSolverAuctioneer(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.SolverAuctioneer)) != 0;
}

export function flagUnknownAuctioneer(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.UnknownAuctioneer)) != 0;
}

export function flagVerifyCallChainHash(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.VerifyCallChainHash)) != 0;
}

export function flagForwardReturnData(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.ForwardReturnData)) != 0;
}

export function flagRequireFulfillment(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.RequireFulfillment)) != 0;
}

export function flagTrustedOpHash(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.TrustedOpHash)) != 0;
}

export function flagInvertBidValue(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.InvertBidValue)) != 0;
}

export function flagExPostBids(callConfig: number): boolean {
  return (Number(callConfig) & (1 << CallConfigIndex.ExPostBids)) != 0;
}

export function flagAllowAllocateValueFailure(callConfig: number): boolean {
  return (
    (Number(callConfig) & (1 << CallConfigIndex.AllowAllocateValueFailure)) != 0
  );
}
