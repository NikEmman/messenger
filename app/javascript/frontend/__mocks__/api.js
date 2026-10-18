// Manual mock used by `jest.mock("../api")`: real ApiError, stubbed requests.
const { ApiError } = jest.requireActual("../api");

export { ApiError };

export const api = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  postForm: jest.fn(),
  putForm: jest.fn(),
};
