export default {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^~(.*)$": "<rootDir>/src$1",
  },
  setupFilesAfterSetup: ["@testing-library/jest-dom"],
  allowImportingTsExtensions: true
};
