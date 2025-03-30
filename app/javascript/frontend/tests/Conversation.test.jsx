import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Conversation from "../components/Conversation";
import { AppContext } from "../components/AppContext";

// Mock fetch
global.fetch = jest.fn();

// Helper function to render Conversation with required providers
const renderConversation = (contextValue, props) => {
  return render(
    <BrowserRouter>
      <AppContext.Provider value={contextValue}>
        <Conversation {...props} />
      </AppContext.Provider>
    </BrowserRouter>
  );
};

describe("Conversation Component", () => {
  const mockConversation = {
    id: "1",
    topic: "Project Discussion",
    messages: [
      { id: "1", body: "Hello everyone!", user_id: "1" },
      { id: "2", body: "Hi there!", user_id: "2" },
    ],
    members: [
      { id: "1", name: "Alice", avatar_url: "alice_avatar.png" },
      { id: "2", name: "Bob", avatar_url: "bob_avatar.png" },
    ],
  };

  const mockUser = { id: "1", name: "Alice", avatar_url: "alice_avatar.png" };
  const defaultContextValue = {
    user: mockUser,
    loggedInStatus: "LOGGED_IN",
    url: "http://localhost:3000",
  };

  const mockHandleNotificationChange = jest.fn();
  const mockHandleMessageSent = jest.fn();
  const mockHandleMemberAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls handleMemberAdded when a user is added", async () => {
    // Mock the fetch response for fetching users
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: "ok",
          users: [{ id: "3", name: "Charlie", email: "charlie@example.com" }],
        }),
    });

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
      });

      // Ensure the "Add user" button renders
      const addUserButton = await waitFor(() => screen.getByText("Add user"));
      fireEvent.click(addUserButton);

      // Wait for user list to load
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search users")).toBeInTheDocument();
      });

      // Mock the fetch response for adding a user
      global.fetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            status: "created",
          }),
      });

      // Search for a user and select from dropdown
      fireEvent.change(screen.getByPlaceholderText("Search users"), {
        target: { value: "charlie@example.com" },
      });
      fireEvent.change(screen.getByRole("listbox"), { target: { value: "3" } });

      // Click "Add" button to add the user
      fireEvent.click(
        screen.getByText((content, element) => {
          return (
            element.tagName.toLowerCase() === "button" &&
            content.trim() === "Add"
          );
        })
      );
    });

    await waitFor(() => {
      // Assert the API call
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/conversation_users",
        expect.any(Object)
      );
      // Assert notifications and callback
      expect(mockHandleNotificationChange).toHaveBeenCalledWith("Added member");
      expect(mockHandleMemberAdded).toHaveBeenCalledWith({
        id: "3",
        name: "Charlie",
        email: "charlie@example.com",
      });
    });
  });
});
