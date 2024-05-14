import { TypedDataDomain } from "@ethersproject/abstract-signer";

export interface ChainConfig {
  contracts: {
    atlas: {
      address: string;
    };
    atlasVerification: {
      address: string;
    };
    sorter: {
      address: string;
    };
    simulator: {
      address: string;
    };
    multicall3: {
      address: string;
    };
  };
  eip712Domain: TypedDataDomain;
}

export const chainConfig: { [chainId: number]: ChainConfig } = {
  // Unit tests
  0: {
    contracts: {
      atlas: {
        address: "",
      },
      atlasVerification: {
        address: "",
      },
      sorter: {
        address: "",
      },
      simulator: {
        address: "",
      },
      multicall3: {
        address: "",
      },
    },
    eip712Domain: {
      name: "AtlasVerification",
      version: "1.0",
      chainId: 1,
      verifyingContract: "0x8Be503bcdEd90ED42Eff31f56199399B2b0154CA",
    },
  },

  // Sepolia
  11155111: {
    contracts: {
      atlas: {
        address: "0xb90B75C2e84cEFeB237266b1cd46E9E5eEdc2dA5",
      },
      atlasVerification: {
        address: "0xa4D727dF141e2e8b0001242e54E33DBACA860fb8",
      },
      sorter: {
        address: "0x4F7F8e6E53E995935De0Cd72199690A56B5AdB00",
      },
      simulator: {
        address: "0x45C7432ca6dc674Dcc9e387cF523D438572A8ac2",
      },
      multicall3: {
        address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      },
    },
    eip712Domain: {
      name: "AtlasVerification",
      version: "1.0",
      chainId: 11155111,
      verifyingContract: "0xa4D727dF141e2e8b0001242e54E33DBACA860fb8",
    },
  },
};
