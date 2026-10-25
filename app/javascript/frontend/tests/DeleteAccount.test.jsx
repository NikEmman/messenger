import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AppContext } from "../components/AppContext";
import DeleteAccount from "../components/DeleteAccount";
import { api, ApiError } from "../api";

jest.mock("../api");

const renderDeleteAccount = (handleSuccessfulLogOut = jest.fn()) =>
  render(
    <MemoryRouter initialEntries={["/profile/1"]}>
      <AppContext.Provider value={{ handleSuccessfulLogOut }}>
        <Routes>
          <Route path="/profile/:id" element={<DeleteAccount />} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </AppContext.Provider>
    </MemoryRouter>
  );

const confirmWith = (password) => {
  fireEvent.click(screen.getByText("Delete account"));
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByText("Delete permanently"));
};

describe("DeleteAccount", () => {
  beforeEach(() => jest.clearAllMocks());

  test("asks for the password before deleting", () => {
    renderDeleteAccount();

    fireEvent.click(screen.getByText("Delete account"));

    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("Delete permanently")).toBeDisabled();
    expect(api.delete).not.toHaveBeenCalled();
  });

  test("deletes the account, logs out and goes home", async () => {
    api.delete.mockResolvedValueOnce(null);
    const handleSuccessfulLogOut = jest.fn();
    renderDeleteAccount(handleSuccessfulLogOut);

    confirmWith("secret123");

    await waitFor(() => expect(screen.getByText("Home Page")).toBeInTheDocument());
    expect(api.delete).toHaveBeenCalledWith("/api/account", { password: "secret123" });
    expect(handleSuccessfulLogOut).toHaveBeenCalled();
  });

  test("shows the server's error, e.g. a wrong password", async () => {
    api.delete.mockRejectedValueOnce(new ApiError(401, { error: "Wrong password" }));
    renderDeleteAccount();

    confirmWith("nope");

    expect(await screen.findByText("Wrong password")).toBeInTheDocument();
  });

  test("cancel goes back to the button", () => {
    renderDeleteAccount();

    fireEvent.click(screen.getByText("Delete account"));
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.getByText("Delete account")).toBeInTheDocument();
  });
});
