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
        address: "0xab654945B45D32465f83bC8B1a13F075c89F7246",
      },
      atlasVerification: {
        address: "0x95c8B9Cff6c3ff7E119B1D70C8E10c07D5160AD6",
      },
      sorter: {
        address: "0x09c69Fefd937d2B05fB8a313120fCA5176b3Aa1d",
      },
    },
    eip712Domain: {
      name: "AtlasVerification",
      version: "1.0",
      chainId: 11155111,
      verifyingContract: "0x95c8B9Cff6c3ff7E119B1D70C8E10c07D5160AD6",
    },
  },
};
