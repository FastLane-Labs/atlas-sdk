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
        address: "0xa892eb9F79E0D1b6277B3456b0a8FE770386f6DB",
      },
      atlasVerification: {
        address: "0xeeB91b2d317e3A747E88c1CA542ae31E32B87FDF",
      },
      sorter: {
        address: "0xAAdF6272cCE4121Db92da224C28d1B59C9feF4d5",
      },
    },
    eip712Domain: {
      name: "AtlasVerification",
      version: "1.0",
      chainId: 11155111,
      verifyingContract: "0xeeB91b2d317e3A747E88c1CA542ae31E32B87FDF",
    },
  },
};
