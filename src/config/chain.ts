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
};
