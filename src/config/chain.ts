import { TypedDataDomain } from "ethers";

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

  // Ethereum Sepolia
  11155111: {
    contracts: {
      atlas: {
        address: "0x9EE12d2fed4B43F4Be37F69930CcaD9B65133482",
      },
      atlasVerification: {
        address: "0xB6F66a1b7cec02324D83c8DEA192818cA23A08B3",
      },
      sorter: {
        address: "0xFE3c655d4D305Ac7f1c2F6306C79397560Afea0C",
      },
      simulator: {
        address: "0xc3ab39ebd49D80bc36208545021224BAF6d2Bdb0",
      },
      multicall3: {
        address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      },
    },
    eip712Domain: {
      name: "AtlasVerification",
      version: "1.0",
      chainId: 11155111,
      verifyingContract: "0xB6F66a1b7cec02324D83c8DEA192818cA23A08B3",
    },
  },

  // Polygon Mainnet
  137: {
    contracts: {
      atlas: {
        address: "0x892F8f6779ca6927c1A6Cc74319e03d2abEf18D5",
      },
      atlasVerification: {
        address: "0xc05DDBe9745ce9DB45C32F5e4C1DA7a3c4FDa220",
      },
      sorter: {
        address: "0x81f1E70A11A9E10Fa314cC093D149E5ec56EE97f",
      },
      simulator: {
        address: "0xfBc81A39459E0D82EC31B4e585f7A318AFAdB49B",
      },
      multicall3: {
        address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      },
    },
    eip712Domain: {
      name: "AtlasVerification",
      version: "1.0",
      chainId: 137,
      verifyingContract: "0xc05DDBe9745ce9DB45C32F5e4C1DA7a3c4FDa220",
    },
  },

  // Polygon Amoy
  80002: {
    contracts: {
      atlas: {
        address: "0x282BdDFF5e58793AcAb65438b257Dbd15A8745C9",
      },
      atlasVerification: {
        address: "0x3b7B38362bB7E2F000Cd2432343F3483F785F435",
      },
      sorter: {
        address: "0xa55051bd82eFeA1dD487875C84fE9c016859659B",
      },
      simulator: {
        address: "0x3efbaBE0ee916A4677D281c417E895a3e7411Ac2",
      },
      multicall3: {
        address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      },
    },
    eip712Domain: {
      name: "AtlasVerification",
      version: "1.0",
      chainId: 137,
      verifyingContract: "0x3b7B38362bB7E2F000Cd2432343F3483F785F435",
    },
  },
};
