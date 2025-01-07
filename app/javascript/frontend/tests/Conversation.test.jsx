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

      const addUserButton = screen.getByText("Add user");
      fireEvent.click(addUserButton);

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

      fireEvent.change(screen.getByPlaceholderText("Search users"), {
        target: { value: "charlie@example.com" },
      });
      fireEvent.change(screen.getByRole("listbox"), { target: { value: "3" } });
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
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/conversation_users",
        expect.any(Object)
      );
      expect(mockHandleNotificationChange).toHaveBeenCalledWith("Added member");
      expect(mockHandleMemberAdded).toHaveBeenCalledWith({
        id: "3",
        name: "Charlie",
        email: "charlie@example.com",
      });
    });
  });
});
