import { TypedDataDomain } from "ethers";

export type AtlasVersion = "1.0" | "1.1" | "1.2" | "1.3" | "1.5";
export const AtlasLatestVersion: AtlasVersion = "1.5";

export function is_v1_5_or_above(version: AtlasVersion): boolean {
  return version === "1.5";
}

export interface ChainConfig {
  contracts: {
    atlas: string;
    atlasVerification: string;
    sorter: string;
    simulator: string;
    multicall3: string;
  };
  eip712Domain: TypedDataDomain;
}

const CHAIN_CONFIG_URL = "https://raw.githubusercontent.com/FastLane-Labs/atlas-config/refs/heads/main/configs/chain-configs-multi-version.json"

let _chainConfig: { [chainId: number]: { [version: string]: ChainConfig } } = {};

async function fetchChainConfig(): Promise<{ [chainId: number]: { [version: string]: ChainConfig } }> {
  const response = await fetch(CHAIN_CONFIG_URL);
  return await response.json();
}

export const chainConfig = async (chainId: number, version: AtlasVersion = AtlasLatestVersion): Promise<ChainConfig> => {
  if (Object.keys(_chainConfig).length === 0) {
    // Unit test chain config
    _chainConfig = {
      0: {
        "1.0": {
          contracts: {
            atlas: "",
            atlasVerification: "",
            sorter: "",
            simulator: "",
            multicall3: "",
          },
          eip712Domain: {
            name: "AtlasVerification",
            version: "1.0",
            chainId: 1,
            verifyingContract: "0x8Be503bcdEd90ED42Eff31f56199399B2b0154CA",
          },
        },
      },
    }

    // Fetch remote config and merge it
    const remoteConfig = await fetchChainConfig();
    _chainConfig = { ..._chainConfig, ...remoteConfig };
  }
  
  return _chainConfig[chainId][version];
};
