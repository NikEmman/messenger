import { api, ApiError } from "../api";

const mockResponse = (data, { status = 200, headers = {} } = {}) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name] ?? null },
    text: () => Promise.resolve(data === null ? "" : JSON.stringify(data)),
  });

describe("api", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    document.head.innerHTML = '<meta name="csrf-token" content="token123">';
  });

  test("GET returns parsed JSON and sends no CSRF token", async () => {
    global.fetch.mockReturnValueOnce(mockResponse({ hello: "world" }));

    await expect(api.get("/api/thing")).resolves.toEqual({ hello: "world" });

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe(`${window.location.origin}/api/thing`);
    expect(options.method).toBe("GET");
    expect(options.headers["X-CSRF-Token"]).toBeUndefined();
  });

  test("POST sends JSON body and CSRF token", async () => {
    global.fetch.mockReturnValueOnce(mockResponse({ id: 1 }, { status: 201 }));

    await api.post("/api/things", { name: "x" });

    const [, options] = global.fetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ name: "x" }));
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers["X-CSRF-Token"]).toBe("token123");
  });

  test("form requests pass FormData through without a content type", async () => {
    global.fetch.mockReturnValueOnce(mockResponse({ ok: true }));
    const form = new FormData();

    await api.putForm("/api/things/1", form);

    const [, options] = global.fetch.mock.calls[0];
    expect(options.method).toBe("PUT");
    expect(options.body).toBe(form);
    expect(options.headers["Content-Type"]).toBeUndefined();
  });

  test("stores a rotated CSRF token from the response", async () => {
    global.fetch.mockReturnValueOnce(
      mockResponse({ user: {} }, { headers: { "X-CSRF-Token": "fresh456" } })
    );

    await api.post("/api/sessions", {});

    expect(document.querySelector('meta[name="csrf-token"]').content).toBe("fresh456");
  });

  test("empty responses resolve to null", async () => {
    global.fetch.mockReturnValueOnce(mockResponse(null, { status: 204 }));

    await expect(api.delete("/api/things/1")).resolves.toBeNull();
  });

  test("non-2xx responses throw ApiError with the server message", async () => {
    global.fetch.mockReturnValueOnce(
      mockResponse({ errors: ["Email has already been taken"] }, { status: 422 })
    );

    const error = await api.post("/api/registrations", {}).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.message).toBe("Email has already been taken");
  });
});
