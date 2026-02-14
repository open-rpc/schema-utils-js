module.exports = {
  clearMocks: true,
  coverageDirectory: "../coverage",
  resetMocks: true,
  restoreMocks: true,
  rootDir: "./src",
  transformIgnorePatterns: ["node_modules/(?!((@open-rpc/spec-types|@open-rpc/spec))/)"],
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", { tsconfig: { allowJs: true } }],
  },
};
