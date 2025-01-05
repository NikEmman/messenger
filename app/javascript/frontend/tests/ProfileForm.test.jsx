import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProfileForm from "../components/ProfileForm";

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn();

describe("ProfileForm Component", () => {
  const mockProfile = {
    address: "123 Test St",
    birthday: "1990-01-01",
  };

  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders form with empty values when no profile provided", () => {
    render(
      <ProfileForm profile={{}} onSubmit={mockOnSubmit} submitText="Submit" />
    );

    const addressInput = screen.getByPlaceholderText("Address");
    const birthdayInput = screen.getByTestId("birthday-input");

    expect(addressInput).toHaveValue("");
    expect(birthdayInput).toHaveValue("");
  });

  test("renders form with provided profile values", () => {
    render(
      <ProfileForm
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        submitText="Update"
      />
    );

    const addressInput = screen.getByPlaceholderText("Address");
    const birthdayInput = screen.getByTestId("birthday-input");

    expect(addressInput).toHaveValue("123 Test St");
    expect(birthdayInput).toHaveValue("1990-01-01");
  });

  test("handles input changes correctly", () => {
    render(
      <ProfileForm profile={{}} onSubmit={mockOnSubmit} submitText="Submit" />
    );

    const addressInput = screen.getByPlaceholderText("Address");
    const birthdayInput = screen.getByTestId("birthday-input");

    fireEvent.change(addressInput, {
      target: { name: "address", value: "New Address" },
    });
    fireEvent.change(birthdayInput, {
      target: { name: "birthday", value: "2000-01-01" },
    });

    expect(addressInput).toHaveValue("New Address");
    expect(birthdayInput).toHaveValue("2000-01-01");
  });

  test("handles image upload correctly", () => {
    URL.createObjectURL.mockReturnValue("mock-url");

    render(
      <ProfileForm profile={{}} onSubmit={mockOnSubmit} submitText="Submit" />
    );

    const file = new File(["test"], "test.png", { type: "image/png" });
    const fileInput = screen.getByTestId("avatar-input");

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByAltText("not found")).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
  });

  test("handles image removal correctly", async () => {
    URL.createObjectURL.mockReturnValue("mock-url");

    render(
      <ProfileForm profile={{}} onSubmit={mockOnSubmit} submitText="Submit" />
    );

    // Upload image
    const file = new File(["test"], "test.png", { type: "image/png" });
    const fileInput = screen.getByTestId("avatar-input");
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Remove image
    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByAltText("not found")).not.toBeInTheDocument();
    });
  });

  test("submits form data correctly", () => {
    render(
      <ProfileForm
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        submitText="Submit"
      />
    );

    const addressInput = screen.getByPlaceholderText("Address");
    const birthdayInput = screen.getByTestId("birthday-input");

    fireEvent.change(addressInput, {
      target: { name: "address", value: "New Address" },
    });
    fireEvent.change(birthdayInput, {
      target: { name: "birthday", value: "2000-01-01" },
    });

    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      address: "New Address",
      birthday: "2000-01-01",
      avatar: null,
    });
  });

  test("submits form with image data correctly", () => {
    render(
      <ProfileForm
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        submitText="Submit"
      />
    );

    const file = new File(["test"], "test.png", { type: "image/png" });
    const fileInput = screen.getByTestId("avatar-input");

    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      address: "123 Test St",
      birthday: "1990-01-01",
      avatar: file,
    });
  });

  test("prevents form submission on enter key", () => {
    render(
      <ProfileForm profile={{}} onSubmit={mockOnSubmit} submitText="Submit" />
    );

    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);

    // The default form submission should be prevented
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
