import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AppContext } from "../components/AppContext";
import Navbar from "../components/Navbar";
import "@testing-library/jest-dom";

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock fetch
global.fetch = jest.fn();

// Helper function to render Navbar with necessary providers
const renderNavbar = (props = {}) => {
  const defaultContextValue = {
    user: { id: "123" },
    loggedInStatus: "LOGGED_IN",
    url: "http://localhost:3000", // Added the url property
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

    expect(screen.getByText("Messages")).toBeInTheDocument();
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

  test("handles logout successfully", async () => {
    // Mock successful logout response
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ logged_out: true }),
    });

    const mockHandleSuccessfulLogOut = jest.fn();
    renderNavbar({
      contextValue: {
        handleSuccessfulLogOut: mockHandleSuccessfulLogOut,
      },
    });

    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/logout",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          mode: "cors",
        }
      );
      expect(mockHandleSuccessfulLogOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("navigates to correct routes when clicking links", () => {
    renderNavbar();

    const messagesLink = screen.getByText("Messages");
    const profileLink = screen.getByText("Profile");

    expect(messagesLink.getAttribute("href")).toBe("/messages");
    expect(profileLink.getAttribute("href")).toBe("/profile/123");
  });
});
