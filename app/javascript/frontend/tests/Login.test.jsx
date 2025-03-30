import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom";
import Login from "../components/Login";
import { AppContext } from "../components/AppContext";

describe("Login Component", () => {
  const mockHandleSuccessfulAuth = jest.fn();

  const mockContextValue = {
    handleSuccessfulAuth: mockHandleSuccessfulAuth,
    loggedInStatus: "NOT_LOGGED_IN",
    user: {},
  };

  const renderWithRouter = (ui, { route = "/" } = {}) => {
    window.history.pushState({}, "Test page", route);

    return render(
      <Router>
        <AppContext.Provider value={mockContextValue}>{ui}</AppContext.Provider>
      </Router>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test("renders login form with empty values", () => {
    renderWithRouter(<Login />);

    const emailInput = screen.getByPlaceholderText("Email");
    const passwordInput = screen.getByPlaceholderText("Password");

    expect(emailInput).toHaveValue("");
    expect(passwordInput).toHaveValue("");
  });

  test("validates email and password fields", () => {
    renderWithRouter(<Login />);

    // const emailInput = screen.getByPlaceholderText("Email");
    // const passwordInput = screen.getByPlaceholderText("Password");
    const submitButton = screen.getByText("Sign In");

    fireEvent.click(submitButton);

    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  test("handles input changes correctly", () => {
    renderWithRouter(<Login />);

    const emailInput = screen.getByPlaceholderText("Email");
    const passwordInput = screen.getByPlaceholderText("Password");

    fireEvent.change(emailInput, {
      target: { name: "email", value: "test@example.com" },
    });
    fireEvent.change(passwordInput, {
      target: { name: "password", value: "password123" },
    });

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  test("displays login error message", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ status: 401, logged_in: false }),
    });

    renderWithRouter(<Login />);

    const emailInput = screen.getByPlaceholderText("Email");
    const passwordInput = screen.getByPlaceholderText("Password");
    const submitButton = screen.getByText("Sign In");

    fireEvent.change(emailInput, {
      target: { name: "email", value: "wrong@example.com" },
    });
    fireEvent.change(passwordInput, {
      target: { name: "password", value: "wrongpassword" },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Wrong email or password")).toBeInTheDocument();
    });
  });

  test("redirects to messages page if user is already logged in", () => {
    const loggedInMockContextValue = {
      handleSuccessfulAuth: mockHandleSuccessfulAuth,
      loggedInStatus: "LOGGED_IN",
      user: { email: "test@example.com" },
    };

    render(
      <Router>
        <AppContext.Provider value={loggedInMockContextValue}>
          <Login />
        </AppContext.Provider>
      </Router>
    );

    expect(screen.getByText("You are already logged in")).toBeInTheDocument();
  });

  test("submits form data correctly", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: "created",
          user: { email: "test@example.com" },
        }),
    });

    renderWithRouter(<Login />);

    const emailInput = screen.getByPlaceholderText("Email");
    const passwordInput = screen.getByPlaceholderText("Password");
    const submitButton = screen.getByText("Sign In");

    fireEvent.change(emailInput, {
      target: { name: "email", value: "test@example.com" },
    });
    fireEvent.change(passwordInput, {
      target: { name: "password", value: "password123" },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHandleSuccessfulAuth).toHaveBeenCalledWith({
        email: "test@example.com",
      });
    });
  });
});
