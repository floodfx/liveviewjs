/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  coverageDirectory: "coverage",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  coveragePathIgnorePatterns: ["/node_modules/", "/dist/"],
  roots: ["<rootDir>/src"],
  verbose: false,
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};
