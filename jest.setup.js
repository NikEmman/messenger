// jest.setup.js
import "@testing-library/jest-dom";
const { TextEncoder, TextDecoder } = require("util");
const fetch = require("cross-fetch");

// Set up for React 18
global.IS_REACT_ACT_ENVIRONMENT = true;

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.fetch = fetch;
