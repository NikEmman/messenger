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

// Helper function to render Navbar with required providers
const renderNavbar = (contextValue) => {
  return render(
    <BrowserRouter>
      <AppContext.Provider value={contextValue}>
        <Navbar />
      </AppContext.Provider>
    </BrowserRouter>
  );
};

describe("Navbar Component", () => {
  const defaultContextValue = {
    user: { id: "123" },
    loggedInStatus: "LOGGED_IN",
    handleSuccessfulLogOut: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all navigation links when logged in", () => {
    renderNavbar(defaultContextValue);

    expect(screen.getByText("Messages")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  test("renders correct profile link with user ID", () => {
    renderNavbar(defaultContextValue);

    const profileLink = screen.getByText("Profile");
    expect(profileLink.getAttribute("href")).toBe("/profile/123");
  });

  test("does not show logout button when logged out", () => {
    const loggedOutContext = {
      ...defaultContextValue,
      loggedInStatus: "NOT_LOGGED_IN",
    };

    renderNavbar(loggedOutContext);

    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  test("handles logout successfully", async () => {
    // Mock successful logout response
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ logged_out: true }),
    });

    renderNavbar(defaultContextValue);

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
      expect(defaultContextValue.handleSuccessfulLogOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("navigates to correct routes when clicking links", () => {
    renderNavbar(defaultContextValue);

    const messagesLink = screen.getByText("Messages");
    const profileLink = screen.getByText("Profile");

    expect(messagesLink.getAttribute("href")).toBe("/messages");
    expect(profileLink.getAttribute("href")).toBe("/profile/123");
  });
});
