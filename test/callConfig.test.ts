import {
  flagUserNoncesSequential,
  flagDAppNoncesSequential,
  flagRequirePreOps,
  flagTrackPreOpsReturnData,
  flagTrackUserReturnData,
  flagDelegateUser,
  flagPreSolver,
  flagPostSolver,
  flagRequirePostOpsCall,
  flagZeroSolvers,
  flagReuseUserOp,
  flagUserAuctioneer,
  flagSolverAuctioneer,
  flagUnknownAuctioneer,
  flagVerifyCallChainHash,
  flagForwardReturnData,
  flagRequireFulfillment,
  flagTrustedOpHash,
  flagInvertBidValue,
  flagExPostBids,
  flagAllowAllocateValueFailure,
} from "../src/utils";

describe("Atlas SDK callConfig tests", () => {
  test("flagUserNoncesSequential true", () => {
    expect(flagUserNoncesSequential(1065025)).toBe(true);
  });

  test("flagUserNoncesSequential false", () => {
    expect(flagUserNoncesSequential(0)).toBe(false);
    expect(flagUserNoncesSequential(1069120)).toBe(false);
  });

  test("flagDAppNoncesSequential true", () => {
    expect(flagDAppNoncesSequential(20562)).toBe(true);
  });

  test("flagDAppNoncesSequential false", () => {
    expect(flagDAppNoncesSequential(0)).toBe(false);
    expect(flagDAppNoncesSequential(151632)).toBe(false);
  });

  test("flagRequirePreOps true", () => {
    expect(flagRequirePreOps(152148)).toBe(true);
  });

  test("flagRequirePreOps false", () => {
    expect(flagRequirePreOps(0)).toBe(false);
    expect(flagRequirePreOps(152146)).toBe(false);
  });

  test("flagTrackPreOpsReturnData true", () => {
    expect(flagTrackPreOpsReturnData(184922)).toBe(true);
  });

  test("flagTrackPreOpsReturnData false", () => {
    expect(flagTrackPreOpsReturnData(0)).toBe(false);
    expect(flagTrackPreOpsReturnData(184386)).toBe(false);
  });

  test("flagTrackUserReturnData true", () => {
    expect(flagTrackUserReturnData(182354)).toBe(true);
  });

  test("flagTrackUserReturnData false", () => {
    expect(flagTrackUserReturnData(0)).toBe(false);
    expect(flagTrackUserReturnData(182850)).toBe(false);
  });

  test("flagDelegateUser true", () => {
    expect(flagDelegateUser(182306)).toBe(true);
  });

  test("flagDelegateUser false", () => {
    expect(flagDelegateUser(0)).toBe(false);
    expect(flagDelegateUser(51202)).toBe(false);
  });

  test("flagPreSolver true", () => {
    expect(flagPreSolver(59458)).toBe(true);
  });

  test("flagPreSolver false", () => {
    expect(flagPreSolver(0)).toBe(false);
    expect(flagPreSolver(59650)).toBe(false);
  });

  test("flagPostSolver true", () => {
    expect(flagPostSolver(60802)).toBe(true);
  });

  test("flagPostSolver false", () => {
    expect(flagPostSolver(0)).toBe(false);
    expect(flagPostSolver(60418)).toBe(false);
  });

  test("flagRequirePostOpsCall true", () => {
    expect(flagRequirePostOpsCall(60842)).toBe(true);
  });

  test("flagRequirePostOpsCall false", () => {
    expect(flagRequirePostOpsCall(0)).toBe(false);
    expect(flagRequirePostOpsCall(60586)).toBe(false);
  });

  test("flagZeroSolvers true", () => {
    expect(flagZeroSolvers(35498)).toBe(true);
  });

  test("flagZeroSolvers false", () => {
    expect(flagZeroSolvers(0)).toBe(false);
    expect(flagZeroSolvers(32938)).toBe(false);
  });

  test("flagReuseUserOp true", () => {
    expect(flagReuseUserOp(34474)).toBe(true);
  });

  test("flagReuseUserOp false", () => {
    expect(flagReuseUserOp(0)).toBe(false);
    expect(flagReuseUserOp(37546)).toBe(false);
  });

  test("flagUserAuctioneer true", () => {
    expect(flagUserAuctioneer(39594)).toBe(true);
  });

  test("flagUserAuctioneer false", () => {
    expect(flagUserAuctioneer(0)).toBe(false);
    expect(flagUserAuctioneer(33450)).toBe(false);
  });

  test("flagSolverAuctioneer true", () => {
    expect(flagSolverAuctioneer(39594)).toBe(true);
  });

  test("flagSolverAuctioneer false", () => {
    expect(flagSolverAuctioneer(0)).toBe(false);
    expect(flagSolverAuctioneer(35498)).toBe(false);
  });

  test("flagUnknownAuctioneer true", () => {
    expect(flagUnknownAuctioneer(43520)).toBe(true);
  });

  test("flagUnknownAuctioneer false", () => {
    expect(flagUnknownAuctioneer(0)).toBe(false);
    expect(flagUnknownAuctioneer(35328)).toBe(false);
  });

  test("flagVerifyCallChainHash true", () => {
    expect(flagVerifyCallChainHash(59904)).toBe(true);
  });

  test("flagVerifyCallChainHash false", () => {
    expect(flagVerifyCallChainHash(0)).toBe(false);
    expect(flagVerifyCallChainHash(43520)).toBe(false);
  });

  test("flagForwardReturnData true", () => {
    expect(flagForwardReturnData(43520)).toBe(true);
  });

  test("flagForwardReturnData false", () => {
    expect(flagForwardReturnData(0)).toBe(false);
    expect(flagForwardReturnData(10752)).toBe(false);
  });

  test("flagRequireFulfillment true", () => {
    expect(flagRequireFulfillment(109056)).toBe(true);
  });

  test("flagRequireFulfillment false", () => {
    expect(flagRequireFulfillment(0)).toBe(false);
    expect(flagRequireFulfillment(43520)).toBe(false);
  });

  test("flagTrustedOpHash true", () => {
    expect(flagTrustedOpHash(174592)).toBe(true);
  });

  test("flagTrustedOpHash false", () => {
    expect(flagTrustedOpHash(0)).toBe(false);
    expect(flagTrustedOpHash(305664)).toBe(false);
  });

  test("flagInvertBidValue true", () => {
    expect(flagInvertBidValue(436736)).toBe(true);
  });

  test("flagInvertBidValue false", () => {
    expect(flagInvertBidValue(0)).toBe(false);
    expect(flagInvertBidValue(174592)).toBe(false);
  });

  test("flagExPostBids true", () => {
    expect(flagExPostBids(698880)).toBe(true);
  });

  test("flagExPostBids false", () => {
    expect(flagExPostBids(0)).toBe(false);
    expect(flagExPostBids(436736)).toBe(false);
  });

  test("flagAllowAllocateValueFailure true", () => {
    expect(flagAllowAllocateValueFailure(1485312)).toBe(true);
  });

  test("flagAllowAllocateValueFailure false", () => {
    expect(flagAllowAllocateValueFailure(0)).toBe(false);
    expect(flagAllowAllocateValueFailure(436752)).toBe(false);
  });
});
