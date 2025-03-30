import React from "react";
import { act } from "react"; // Import act from react instead of react-dom/test-utils
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppContext } from "../components/AppContext";
import Profile from "../components/Profile";

// Mock ProfileForm component
jest.mock("../components/ProfileForm", () => {
  return function MockProfileForm({ onSubmit, submitText }) {
    return (
      <div data-testid="profile-form">
        <button
          onClick={() =>
            onSubmit({
              address: "123 Test St",
              birthday: "1990-01-01",
              avatar: new File([""], "test.jpg"),
            })
          }
        >
          {submitText}
        </button>
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

// Helper function to render Profile with necessary providers and mocks
const renderProfile = (props = {}) => {
  const defaultContextValue = {
    user: { id: 1, name: "Test User" },
    loggedInStatus: "LOGGED_IN",
    url: "http://localhost:3000",
    ...props.contextValue,
  };

  return render(
    <BrowserRouter>
      <Routes>
        <Route
          path="/profile/:id"
          element={
            <AppContext.Provider value={defaultContextValue}>
              <Profile />
            </AppContext.Provider>
          }
        />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </BrowserRouter>
  );
};

describe("Profile Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.pushState({}, "", "/profile/1");
  });

  test("redirects to home when not logged in", () => {
    renderProfile({
      contextValue: {
        user: {},
        loggedInStatus: "NOT_LOGGED_IN",
        url: "http://localhost:3000",
      },
    });

    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  test("shows create profile form for current user with no profile", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ status: "not_found" }),
    });

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Create a profile first")).toBeInTheDocument();
      expect(screen.getByTestId("profile-form")).toBeInTheDocument();
    });

    // Verify the correct URL was used in fetch
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/profiles/1"
    );
  });

  test("shows message for non-existent profile of other user", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ status: "not_found" }),
    });

    window.history.pushState({}, "", "/profile/2");
    renderProfile();

    await waitFor(() => {
      expect(
        screen.getByText("This user has not created a profile yet")
      ).toBeInTheDocument();
    });

    // Verify the correct URL was used in fetch
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/profiles/2"
    );
  });

  test("displays profile information when profile exists", async () => {
    const mockProfile = {
      id: 1,
      name: "Test User", // Added name to match the component expectation
      address: "123 Test St",
      birthday: "1990-01-01",
      avatar_url: "test.jpg",
    };

    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockProfile),
    });

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Address:")).toBeInTheDocument();
      expect(screen.getByText("Birthday:")).toBeInTheDocument();
      expect(screen.getByAltText("Avatar")).toBeInTheDocument();
      expect(screen.getByText("Test User")).toBeInTheDocument(); // Check for name
    });
  });

  test("displays Anonymous when profile has no name", async () => {
    const mockProfile = {
      id: 1,
      // No name property
      address: "123 Test St",
      birthday: "1990-01-01",
      avatar_url: "test.jpg",
    };

    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockProfile),
    });

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Anonymous")).toBeInTheDocument();
    });
  });

  test("handles create profile submission", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/profiles/1")) {
        return Promise.resolve({
          json: () => Promise.resolve({ status: "not_found" }),
        });
      }
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            profile: {
              id: 1,
              name: "Test User",
              address: "123 Test St",
              birthday: "1990-01-01",
              avatar_url: "test.jpg",
            },
          }),
      });
    });

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Create")).toBeInTheDocument();
    });

    // Mock FormData to verify file inclusion
    const mockAppendMethod = jest.fn();
    const originalFormData = global.FormData;
    global.FormData = jest.fn(() => ({
      append: mockAppendMethod,
    }));

    await act(async () => {
      fireEvent.click(screen.getByText("Create"));
    });

    // Restore FormData
    global.FormData = originalFormData;

    // Verify FormData creation and properties
    expect(mockAppendMethod).toHaveBeenCalledWith("profile[user_id]", 1);
    expect(mockAppendMethod).toHaveBeenCalledWith(
      "profile[address]",
      "123 Test St"
    );
    expect(mockAppendMethod).toHaveBeenCalledWith(
      "profile[birthday]",
      "1990-01-01"
    );
    expect(mockAppendMethod).toHaveBeenCalledWith(
      "profile[avatar]",
      expect.any(File)
    );

    // Verify fetch call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/profiles/",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          mode: "cors",
        })
      );
    });
  });

  test("handles update profile submission", async () => {
    // Initial profile data
    const mockProfile = {
      id: 1,
      name: "Test User",
      address: "123 Test St",
      birthday: "1990-01-01",
      avatar_url: "test.jpg",
    };

    // Setup fetch mock to handle both the initial GET and subsequent PUT
    let fetchCallCount = 0;
    global.fetch.mockImplementation((url, options) => {
      fetchCallCount++;
      if (fetchCallCount === 1) {
        // Initial GET request
        return Promise.resolve({
          json: () => Promise.resolve(mockProfile),
        });
      } else {
        // PUT request
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              profile: {
                ...mockProfile,
                address: "456 Update St",
              },
            }),
        });
      }
    });

    renderProfile();

    // Wait for the profile to be displayed
    await waitFor(() => {
      expect(screen.getByText("Edit profile")).toBeInTheDocument();
    });

    // Click edit button
    await act(async () => {
      fireEvent.click(screen.getByText("Edit profile"));
    });

    // Wait for update form
    await waitFor(() => {
      expect(screen.getByText("Update")).toBeInTheDocument();
    });

    // Mock FormData
    const mockAppendMethod = jest.fn();
    const originalFormData = global.FormData;
    global.FormData = jest.fn(() => ({
      append: mockAppendMethod,
    }));

    // Submit update
    await act(async () => {
      fireEvent.click(screen.getByText("Update"));
    });

    // Restore FormData
    global.FormData = originalFormData;

    // Verify FormData for update
    expect(mockAppendMethod).toHaveBeenCalledWith(
      "profile[address]",
      "123 Test St"
    );
    expect(mockAppendMethod).toHaveBeenCalledWith(
      "profile[birthday]",
      "1990-01-01"
    );
    expect(mockAppendMethod).toHaveBeenCalledWith(
      "profile[avatar]",
      expect.any(File)
    );

    // Verify the PUT request
    await waitFor(() => {
      const putCall = global.fetch.mock.calls.find(
        (call) => call[1]?.method === "PUT"
      );
      expect(putCall[0]).toBe("http://localhost:3000/api/profiles/1");
      expect(putCall[1]).toMatchObject({
        method: "PUT",
        credentials: "include",
        mode: "cors",
      });
    });
  });

  test("shows edit button only for current user", async () => {
    const mockProfile = {
      id: 2,
      name: "Other User",
      address: "123 Test St",
      birthday: "1990-01-01",
      avatar_url: "test.jpg",
    };

    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockProfile),
    });

    window.history.pushState({}, "", "/profile/2");
    renderProfile();

    await waitFor(() => {
      expect(screen.queryByText("Edit profile")).not.toBeInTheDocument();
    });
  });

  test("handles fetch errors gracefully", async () => {
    // Mock console.error to prevent actual logging during tests
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Mock fetch to throw an error
    global.fetch.mockImplementation(() => {
      return Promise.reject(new Error("Network error"));
    });

    renderProfile();

    // Wait for the error to be caught
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Unable to"),
        expect.any(Error)
      );
    });

    // Restore console.error
    console.error = originalConsoleError;
  });

  test("handles profile creation error", async () => {
    // Mock fetch to return not_found for the profile and then error for create
    global.fetch.mockImplementation((url, options) => {
      if (options?.method === "POST") {
        return Promise.reject(new Error("Creation failed"));
      }
      return Promise.resolve({
        json: () => Promise.resolve({ status: "not_found" }),
      });
    });

    // Mock console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Create")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Create"));
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Unable to create: ",
        expect.any(Error)
      );
    });

    // Restore console.error
    console.error = originalConsoleError;
  });
});
