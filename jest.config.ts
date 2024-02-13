export default {
  preset: "ts-jest/presets/js-with-ts-esm",
  moduleDirectories: ["node_modules", "<rootDir>"],
  testEnvironment: "./jsdomEnvironment.ts",
  setupFilesAfterEnv: ["./jest.setup.ts"],
};
