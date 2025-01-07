import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import "@testing-library/jest-dom";
import SignUp from "../components/SignUp";
import { AppContext } from "../components/AppContext";

describe("SignUp Component", () => {
  const mockHandleSuccessfulAuth = jest.fn();

  const mockContextValue = {
    handleSuccessfulAuth: mockHandleSuccessfulAuth,
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

  test("renders sign up form with empty values", () => {
    renderWithRouter(<SignUp />);

    const emailInput = screen.getByPlaceholderText("Email");
    const nameInput = screen.getByPlaceholderText("User name");
    const passwordInput = screen.getByPlaceholderText("Password");
    const passwordConfirmationInput =
      screen.getByPlaceholderText("Confirm Password");

    expect(emailInput).toHaveValue("");
    expect(nameInput).toHaveValue("");
    expect(passwordInput).toHaveValue("");
    expect(passwordConfirmationInput).toHaveValue("");
  });

  test("validates form fields correctly", () => {
    renderWithRouter(<SignUp />);

    const submitButton = screen.getByRole("button", { name: "Sign Up" });

    fireEvent.click(submitButton);

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  test("handles input changes correctly", () => {
    renderWithRouter(<SignUp />);

    const emailInput = screen.getByPlaceholderText("Email");
    const nameInput = screen.getByPlaceholderText("User name");
    const passwordInput = screen.getByPlaceholderText("Password");
    const passwordConfirmationInput =
      screen.getByPlaceholderText("Confirm Password");

    fireEvent.change(emailInput, {
      target: { name: "email", value: "test@example.com" },
    });
    fireEvent.change(nameInput, {
      target: { name: "name", value: "Test User" },
    });
    fireEvent.change(passwordInput, {
      target: { name: "password", value: "password123" },
    });
    fireEvent.change(passwordConfirmationInput, {
      target: { name: "passwordConfirmation", value: "password123" },
    });

    expect(emailInput).toHaveValue("test@example.com");
    expect(nameInput).toHaveValue("Test User");
    expect(passwordInput).toHaveValue("password123");
    expect(passwordConfirmationInput).toHaveValue("password123");
  });

  test("displays registration error message", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ errors: ["Email has already been taken"] }),
    });

    renderWithRouter(<SignUp />);

    const emailInput = screen.getByPlaceholderText("Email");
    const nameInput = screen.getByPlaceholderText("User name");
    const passwordInput = screen.getByPlaceholderText("Password");
    const passwordConfirmationInput =
      screen.getByPlaceholderText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Sign Up" });

    fireEvent.change(emailInput, {
      target: { name: "email", value: "taken@example.com" },
    });
    fireEvent.change(nameInput, {
      target: { name: "name", value: "Test User" },
    });
    fireEvent.change(passwordInput, {
      target: { name: "password", value: "password123" },
    });
    fireEvent.change(passwordConfirmationInput, {
      target: { name: "passwordConfirmation", value: "password123" },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Email has already been taken")
      ).toBeInTheDocument();
    });
  });

  test("submits form data correctly", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "created",
          user: { email: "test@example.com" },
        }),
    });

    renderWithRouter(<SignUp />);

    const emailInput = screen.getByPlaceholderText("Email");
    const nameInput = screen.getByPlaceholderText("User name");
    const passwordInput = screen.getByPlaceholderText("Password");
    const passwordConfirmationInput =
      screen.getByPlaceholderText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Sign Up" });

    fireEvent.change(emailInput, {
      target: { name: "email", value: "test@example.com" },
    });
    fireEvent.change(nameInput, {
      target: { name: "name", value: "Test User" },
    });
    fireEvent.change(passwordInput, {
      target: { name: "password", value: "password123" },
    });
    fireEvent.change(passwordConfirmationInput, {
      target: { name: "passwordConfirmation", value: "password123" },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHandleSuccessfulAuth).toHaveBeenCalledWith({
        email: "test@example.com",
      });
    });
  });
});
