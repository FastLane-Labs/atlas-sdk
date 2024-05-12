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
        address: "0xab654945B45D32465f83bC8B1a13F075c89F7246",
      },
      atlasVerification: {
        address: "0x95c8B9Cff6c3ff7E119B1D70C8E10c07D5160AD6",
      },
      sorter: {
        address: "0xd401992cEf2a6a481E1c0631f8ad6c062386d3A7",
      },
      simulator: {
        address: "0xa76a0CD24769241F890B322c39ABDd52aa962094",
      },
      multicall3: {
        address: "0xcA11bde05977b3631167028862bE2a173976CA11",
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
