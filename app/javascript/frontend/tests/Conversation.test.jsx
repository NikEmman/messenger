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
import { api } from "../api";
import { emit, sendTyping } from "../cable";

// jsdom has no <trix-editor>; use the textarea stand-in from __mocks__
jest.mock("../components/MessageEditor");

jest.mock("../api");
jest.mock("../cable");

// Mock dialog showModal and close methods for JSDOM
const mockDialog = {
  showModal: jest.fn(),
  close: jest.fn(),
};

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

// Helper to find dialog element and mock its methods
const setupDialogMock = () => {
  const dialog = document.querySelector("dialog");
  if (dialog) {
    dialog.showModal = mockDialog.showModal;
    dialog.close = mockDialog.close;
  }
};

describe("Conversation Component", () => {
  const mockConversation = {
    id: "1",
    topic: "Project Discussion",
    members: [
      { id: "1", name: "Alice", avatar_url: "alice_avatar.png", membership_id: "m1" },
      { id: "2", name: "Bob", avatar_url: "bob_avatar.png", membership_id: "m2" },
    ],
  };
  const mockMessages = [
    { id: 1, body: "Hello everyone!", user_id: "1" },
    { id: 2, body: "Hi there!", user_id: "2" },
  ];

  // Responses for GET requests, routed by path; tests override as needed.
  let messagesResponse;
  let usersResponse;

  const mockUser = { id: "1", name: "Alice", avatar_url: "alice_avatar.png" };
  const defaultContextValue = {
    user: mockUser,
    loggedInStatus: "LOGGED_IN",
  };

  const mockHandleNotificationChange = jest.fn();
  const mockHandleMessageSent = jest.fn();
  const mockHandleMemberAdded = jest.fn();
  const mockHandleMemberRemoved = jest.fn();
  const mockHandleConversationDeleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    messagesResponse = { messages: mockMessages, has_more: false };
    usersResponse = { users: [] };
    api.get.mockImplementation((path) =>
      Promise.resolve(path.startsWith("/api/users") ? usersResponse : messagesResponse)
    );
    mockDialog.showModal.mockClear();
    mockDialog.close.mockClear();
    window.confirm = jest.fn(() => true);
  });

  it("renders conversation topic and participants", async () => {
    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    expect(screen.getByText("Project Discussion")).toBeInTheDocument();
    // Use getAllByText since Bob appears in both header and modal
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
    // Check that topic and members header exist
    expect(screen.getByText("Project Discussion")).toBeInTheDocument();
  });

  it("renders messages correctly", async () => {
    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    expect(screen.getByText("Hello everyone!")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });

  it("shows 'No messages' message when conversation has no messages", async () => {
    messagesResponse = { messages: [], has_more: false };
    const emptyConversation = {
      id: "1",
      topic: "Empty Chat",
      members: [
        { id: "1", name: "Alice", avatar_url: "alice_avatar.png", membership_id: "m1" },
      ],
    };

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: emptyConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    expect(screen.getByText("No messages yet — say hello!")).toBeInTheDocument();
  });

  it("calls handleMemberAdded when a user is added", async () => {
    // Mock the API response for fetching users
    usersResponse = {
      users: [{ id: "3", name: "Charlie", email: "charlie@example.com" }],
    };

    // Render the component
    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    // Ensure the "Add user" button renders
    const addUserButton = screen.getByText("Add user");
    fireEvent.click(addUserButton);

    // Wait for user list to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search users")).toBeInTheDocument();
    });

    // Mock the API response for adding a user
    api.post.mockResolvedValueOnce({
      member: {
        id: "3",
        name: "Charlie",
        email: "charlie@example.com",
      },
    });

    // Wait for the debounced search results, then select from dropdown
    await screen.findByText("Charlie");
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

    await waitFor(() => {
      // Assert the API call
      expect(api.post).toHaveBeenCalledWith(
        "/api/conversation_users",
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

  it("searches users on the server as you type", async () => {

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    fireEvent.click(screen.getByText("Add user"));
    fireEvent.change(screen.getByPlaceholderText("Search users"), {
      target: { value: "char lie" },
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/users?q=char%20lie");
    });
  });

  it("closes user selection when cancel is clicked", async () => {
    // Mock the API response for fetching users
    usersResponse = {
      users: [{ id: "3", name: "Charlie", email: "charlie@example.com" }],
    };

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    // Click "Add user" button
    const addUserButton = screen.getByText("Add user");
    fireEvent.click(addUserButton);

    // Wait for user list to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search users")).toBeInTheDocument();
    });

    // Click Cancel button
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    // Verify we're back to the original state with Add user button visible
    expect(screen.getByText("Add user")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search users")).not.toBeInTheDocument();
  });

  it("opens manage members modal and displays members", async () => {
    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    // Setup dialog mock after render
    setupDialogMock();

    // Click "Manage members" button
    const manageMembersButton = screen.getByText("Manage members");
    fireEvent.click(manageMembersButton);

    // Verify showModal was called
    expect(mockDialog.showModal).toHaveBeenCalled();

    // Wait for modal content to be visible
    await waitFor(() => {
      expect(screen.getByText("Members")).toBeInTheDocument();
    });

    // Verify "(you)" indicator is shown for current user
    expect(screen.getByText("Alice (you)")).toBeInTheDocument();
    // Verify other member is displayed
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);

    // Verify Leave and Remove buttons exist
    expect(screen.getByText("Leave")).toBeInTheDocument();
    expect(screen.getAllByText("Remove").length).toBe(1);
  });

  it("closes manage members modal when close button is clicked", async () => {
    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    // Setup dialog mock after render
    setupDialogMock();

    // Open the modal
    const manageMembersButton = screen.getByText("Manage members");
    fireEvent.click(manageMembersButton);

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByText("Members")).toBeInTheDocument();
    });

    // Click Close button
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    // Verify close was called
    expect(mockDialog.close).toHaveBeenCalled();
  });

  it("calls handleMemberRemoved when remove button is clicked", async () => {
    // Mock the API response for removing a member
    api.delete.mockResolvedValueOnce({
      status: "ok",
      removed_user_id: "2",
    });

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    // Setup dialog mock
    setupDialogMock();

    // Open the modal
    const manageMembersButton = screen.getByText("Manage members");
    fireEvent.click(manageMembersButton);

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByText("Members")).toBeInTheDocument();
    });

    // Click Remove button
    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);

    await waitFor(() => {
      // Verify API call
      expect(api.delete).toHaveBeenCalledWith("/api/conversation_users/m2");
      // Verify callback
      expect(mockHandleNotificationChange).toHaveBeenCalledWith("Member removed");
      expect(mockHandleMemberRemoved).toHaveBeenCalledWith("2");
    });
  });

  it("calls handleConversationDeleted when removing last member", async () => {
    // Mock the API response for removing the last member (conversation deleted)
    api.delete.mockResolvedValueOnce({
      status: "ok",
      conversation_deleted: true,
    });

    // Create a conversation with only one member (the current user)
    const singleMemberConversation = {
      id: "1",
      topic: "Solo Chat",
      messages: [],
      members: [
        { id: "1", name: "Alice", avatar_url: "alice_avatar.png", membership_id: "m1" },
      ],
    };

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: singleMemberConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    // Setup dialog mock
    setupDialogMock();

    // Open the modal
    const manageMembersButton = screen.getByText("Manage members");
    fireEvent.click(manageMembersButton);

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByText("Members")).toBeInTheDocument();
    });

    // Click Leave button
    const leaveButton = screen.getByText("Leave");
    fireEvent.click(leaveButton);

    await waitFor(() => {
      expect(mockHandleConversationDeleted).toHaveBeenCalledWith("1");
    });
  });

  it("calls handleLeaveConversation when leave button is clicked", async () => {
    // Mock the API response for leaving conversation
    api.delete.mockResolvedValueOnce({
      status: "ok",
    });

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    // Setup dialog mock
    setupDialogMock();

    // Open the modal
    const manageMembersButton = screen.getByText("Manage members");
    fireEvent.click(manageMembersButton);

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByText("Members")).toBeInTheDocument();
    });

    // Click Leave button
    const leaveButton = screen.getByText("Leave");
    fireEvent.click(leaveButton);

    await waitFor(() => {
      // Verify API call
      expect(api.delete).toHaveBeenCalledWith("/api/conversation_users/m1");
      // Verify callback
      expect(mockHandleConversationDeleted).toHaveBeenCalledWith("1");
    });
  });

  it("does not remove member when confirm is cancelled", async () => {
    // Override window.confirm to return false
    window.confirm = jest.fn(() => false);

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    // Setup dialog mock
    setupDialogMock();

    // Open the modal
    const manageMembersButton = screen.getByText("Manage members");
    fireEvent.click(manageMembersButton);

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByText("Members")).toBeInTheDocument();
    });

    // Click Remove button (confirm returns false)
    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);

    // Verify no API call was made
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("sends a message successfully", async () => {
    // Mock the API response for sending a message
    api.post.mockResolvedValueOnce({
      status: "created",
      message: {
        id: "3",
        body: "Test message",
        user_id: "1",
        conversation_id: "1",
      },
    });

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    // Type a message then send
    fireEvent.change(screen.getByTestId("message-editor"), {
      target: { value: "Hello!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      // Verify API call
      expect(api.post).toHaveBeenCalledWith("/api/conversations/1/messages", {
        message: { body: "Hello!" },
      });
      // Verify callback
      expect(mockHandleNotificationChange).toHaveBeenCalledWith("Message successfully sent.");
      expect(mockHandleMessageSent).toHaveBeenCalledWith({
        id: "3",
        body: "Test message",
        user_id: "1",
        conversation_id: "1",
      });
    });
  });

  it("groups consecutive messages and separates days", async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const at = (base, minutes) => new Date(base.getTime() + minutes * 60000).toISOString();
    messagesResponse = {
      has_more: false,
      messages: [
        { id: 1, body: "Old news", user_id: "2", created_at: at(yesterday, 0) },
        { id: 2, body: "First", user_id: "2", created_at: at(now, -3) },
        { id: 3, body: "Second", user_id: "2", created_at: at(now, -2) },
        { id: 4, body: "Reply", user_id: "1", created_at: at(now, -1) },
      ],
    };

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    const separators = screen.getAllByRole("separator").map((el) => el.textContent);
    expect(separators).toEqual(["Yesterday", "Today"]);
    // Bob's name heads each of his groups (yesterday's and today's), not every message
    expect(document.querySelectorAll(".messageSender")).toHaveLength(2);
    expect(screen.getByText("First").closest(".messageContainer")).toHaveClass("groupStart");
    expect(screen.getByText("Second").closest(".messageContainer")).not.toHaveClass("groupStart");
    expect(screen.getByText("Second").closest(".messageContainer")).toHaveClass("groupEnd");
  });

  it("shows a sent message in the conversation", async () => {
    api.post.mockResolvedValueOnce({
      message: { id: 3, body: "Fresh off the press", user_id: "1", conversation_id: "1" },
    });

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    fireEvent.change(screen.getByTestId("message-editor"), {
      target: { value: "Fresh off the press" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("Fresh off the press")).toBeInTheDocument();
  });

  it("loads earlier messages on demand", async () => {
    messagesResponse = { messages: mockMessages, has_more: true };

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    messagesResponse = {
      messages: [{ id: 0, body: "The very first message", user_id: "2" }],
      has_more: false,
    };
    fireEvent.click(screen.getByRole("button", { name: "Load earlier messages" }));

    expect(await screen.findByText("The very first message")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/api/conversations/1/messages?before=1");
    expect(screen.queryByRole("button", { name: "Load earlier messages" })).not.toBeInTheDocument();
  });

  it("appends messages pushed over the socket", async () => {
    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    act(() => {
      emit({
        type: "message",
        message: { id: 7, body: "Live from Metropolis", user_id: "2", conversation_id: "1" },
      });
      // A duplicate delivery must not render twice
      emit({
        type: "message",
        message: { id: 7, body: "Live from Metropolis", user_id: "2", conversation_id: "1" },
      });
      emit({
        type: "message",
        message: { id: 8, body: "Other conversation", user_id: "2", conversation_id: "99" },
      });
    });

    expect(screen.getAllByText("Live from Metropolis")).toHaveLength(1);
    expect(screen.queryByText("Other conversation")).not.toBeInTheDocument();
  });

  it("shows who is typing and sends throttled typing pings", async () => {
    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    act(() => emit({ type: "typing", conversation_id: "1", user_id: "2" }));
    expect(screen.getByText("Bob is typing…")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("message-editor"), { target: { value: "H" } });
    fireEvent.change(screen.getByTestId("message-editor"), { target: { value: "Hi" } });
    expect(sendTyping).toHaveBeenCalledTimes(1);
    expect(sendTyping).toHaveBeenCalledWith("1");
  });

  it("shows presence dots for online members", async () => {
    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
        onlineUserIds: new Set(["2"]),
      });
    });

    expect(screen.getAllByLabelText("online").length).toBeGreaterThan(0);
  });

  it("sends with Enter", async () => {
    api.post.mockResolvedValueOnce({
      message: { id: 3, body: "Sent with enter", user_id: "1", conversation_id: "1" },
    });

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    const editor = screen.getByTestId("message-editor");
    fireEvent.change(editor, { target: { value: "Sent with enter" } });
    fireEvent.keyDown(editor, { key: "Enter" });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/conversations/1/messages", {
        message: { body: "Sent with enter" },
      });
    });
  });

  it("shows error notification when send message fails", async () => {
    // Mock the API response to throw an error
    api.post.mockRejectedValueOnce(new Error("Network error"));

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    // Type a message then send
    fireEvent.change(screen.getByTestId("message-editor"), {
      target: { value: "Hello!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(mockHandleNotificationChange).toHaveBeenCalledWith("Failed to send message");
    });
  });

  it("shows removing/loading state when removing a member", async () => {
    // Mock a slow API response
    api.delete.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ status: "ok", removed_user_id: "2" }), 100))
    );

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    // Setup dialog mock
    setupDialogMock();

    // Open the modal
    const manageMembersButton = screen.getByText("Manage members");
    fireEvent.click(manageMembersButton);

    await waitFor(() => {
      expect(screen.getByText("Members")).toBeInTheDocument();
    });

    // Click Remove button
    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);

    // Verify loading state shows "Removing..."
    expect(screen.getByText("Removing...")).toBeInTheDocument();
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });

  it("shows leaving/loading state when leaving conversation", async () => {
    // Mock a slow API response
    api.delete.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ status: "ok" }), 100))
    );

    await act(async () => {
      renderConversation(defaultContextValue, {
        conversation: mockConversation,
        user: mockUser,
        handleNotificationChange: mockHandleNotificationChange,
        handleMessageSent: mockHandleMessageSent,
        handleMemberAdded: mockHandleMemberAdded,
        handleMemberRemoved: mockHandleMemberRemoved,
        handleConversationDeleted: mockHandleConversationDeleted,
      });
    });

    // Setup dialog mock
    setupDialogMock();

    // Open the modal
    const manageMembersButton = screen.getByText("Manage members");
    fireEvent.click(manageMembersButton);

    await waitFor(() => {
      expect(screen.getByText("Members")).toBeInTheDocument();
    });

    // Click Leave button
    const leaveButton = screen.getByText("Leave");
    fireEvent.click(leaveButton);

    // Verify loading state shows "Leaving..."
    expect(screen.getByText("Leaving...")).toBeInTheDocument();
    expect(screen.queryByText("Leave")).not.toBeInTheDocument();
  });
});
