# Atlas Javascript/Typescript SDK

## Quickstart

Install the SDK package with npm:

```bash
npm install @fastlane-labs/atlas-sdk
```

Install the SDK package with yarn:

```bash
yarn add @fastlane-labs/atlas-sdk
```

Import the package and initialize the SDK.

```js
import { AtlasSdk, FastlaneBackend } from "@fastlane-labs/atlas-sdk";
import { JsonRpcProvider } from "ethers";

// The following values must be adjusted
const chainId = 11155111;
const rpcUrl = "https://rpc.sepolia.org";
const atlasAuctioneerUrl = "https://auctioneer-fra.fastlane-labs.xyz";

// Create the SDK instance
const sdk = await AtlasSdk.create(
  new JsonRpcProvider(rpcUrl, chainId),
  chainId,
  new FastlaneBackend({endpoint: atlasAuctioneerUrl})
);
```

## References

The full API reference is described in this document: https://atlas-docs.pages.dev/atlas/sdks/typescript/methods.
