// jest.setup.js
const { TextEncoder, TextDecoder } = require("util");
const fetch = require("cross-fetch");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.fetch = fetch;
