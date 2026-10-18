import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AppContext } from "../components/AppContext";
import Navbar from "../components/Navbar";
import "@testing-library/jest-dom";
import { api } from "../api";

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../api");

// Helper function to render Navbar with necessary providers
const renderNavbar = (props = {}) => {
  const defaultContextValue = {
    user: { id: "123" },
    loggedInStatus: "LOGGED_IN",
    handleSuccessfulLogOut: jest.fn(),
    ...props.contextValue,
  };

  return render(
    <BrowserRouter>
      <AppContext.Provider value={defaultContextValue}>
        <Navbar />
      </AppContext.Provider>
    </BrowserRouter>
  );
};

describe("Navbar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all navigation links when logged in", () => {
    renderNavbar();

    expect(screen.getByText("Messenger")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  test("renders correct profile link with user ID", () => {
    renderNavbar();

    const profileLink = screen.getByText("Profile");
    expect(profileLink.getAttribute("href")).toBe("/profile/123");
  });

  test("does not show logout button when logged out", () => {
    renderNavbar({
      contextValue: {
        loggedInStatus: "NOT_LOGGED_IN",
        user: {},
      },
    });

    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  test("does not show navigation links when logged out", () => {
    renderNavbar({
      contextValue: {
        loggedInStatus: "NOT_LOGGED_IN",
        user: {},
      },
    });

    expect(screen.queryByText("Messenger")).not.toBeInTheDocument();
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
  });

  test("handles logout successfully", async () => {
    // Mock successful logout response
    api.delete.mockResolvedValueOnce({ logged_out: true });

    const mockHandleSuccessfulLogOut = jest.fn();
    renderNavbar({
      contextValue: {
        handleSuccessfulLogOut: mockHandleSuccessfulLogOut,
      },
    });

    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/api/logout");
      expect(mockHandleSuccessfulLogOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("navigates to correct routes when clicking links", () => {
    renderNavbar();

    const messagesLink = screen.getByText("Messenger");
    const profileLink = screen.getByText("Profile");

    expect(messagesLink.getAttribute("href")).toBe("/messages");
    expect(profileLink.getAttribute("href")).toBe("/profile/123");
  });
});
