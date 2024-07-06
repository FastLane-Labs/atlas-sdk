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

  // Sepolia
  11155111: {
    contracts: {
      atlas: {
        address: "0x1Be854EeA3D753db001aC7A1aaE7Eb30f9B1166a",
      },
      atlasVerification: {
        address: "0x26Bb4e798116Bb01f26A47EDA2597814BDC18467",
      },
      sorter: {
        address: "0x557Fc08FFaBf3CEACDca2f0E91F6958CF29a149d",
      },
      simulator: {
        address: "0xCF9Db077FFC7Ae39210e00468bf94021adFb51a0",
      },
      multicall3: {
        address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      },
    },
    eip712Domain: {
      name: "AtlasVerification",
      version: "1.0",
      chainId: 11155111,
      verifyingContract: "0x26Bb4e798116Bb01f26A47EDA2597814BDC18467",
    },
  },
};
