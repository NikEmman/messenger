// jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleFileExtensions: ["js", "jsx"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
    "^.+\\.css$": "jest-transform-css",
  },
  moduleNameMapper: {
    "^.+\\.(css|less)$": "<rootDir>/CSSStub.js",
  },
};
