import { AtlasVersion, AtlasLatestVersion } from "./chain";
import atlasAbi_1_0 from "../abi/atlas/1.0.json";
import atlasAbi_1_1 from "../abi/atlas/1.1.json";
import atlasAbi_1_2 from "../abi/atlas/1.2.json";
import atlasVerificationAbi_1_0 from "../abi/atlasVerification/1.0.json";
import atlasVerificationAbi_1_1 from "../abi/atlasVerification/1.1.json";
import atlasVerificationAbi_1_2 from "../abi/atlasVerification/1.2.json";
import sorterAbi_1_0 from "../abi/sorter/1.0.json";
import sorterAbi_1_1 from "../abi/sorter/1.1.json";
import sorterAbi_1_2 from "../abi/sorter/1.2.json";
import simulatorAbi_1_0 from "../abi/simulator/1.0.json";
import simulatorAbi_1_1 from "../abi/simulator/1.1.json";
import simulatorAbi_1_2 from "../abi/simulator/1.2.json";

export const atlasAbi = (version: AtlasVersion = AtlasLatestVersion) => {
  switch (version) {
    case "1.0": return atlasAbi_1_0;
    case "1.1": return atlasAbi_1_1;
    case "1.2": return atlasAbi_1_2;
  }
};

export const atlasVerificationAbi = (version: AtlasVersion = AtlasLatestVersion) => {
  switch (version) {
    case "1.0": return atlasVerificationAbi_1_0;
    case "1.1": return atlasVerificationAbi_1_1;
    case "1.2": return atlasVerificationAbi_1_2;
  }
};

export const sorterAbi = (version: AtlasVersion = AtlasLatestVersion) => {
  switch (version) {
    case "1.0": return sorterAbi_1_0;
    case "1.1": return sorterAbi_1_1;
    case "1.2": return sorterAbi_1_2;
  }
};

export const simulatorAbi = (version: AtlasVersion = AtlasLatestVersion) => {
  switch (version) {
    case "1.0": return simulatorAbi_1_0;
    case "1.1": return simulatorAbi_1_1;
    case "1.2": return simulatorAbi_1_2;
  }
};
