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

// Use the __mocks__/react-quill.jsx stub so we can interact with the editor
jest.mock("react-quill");

// Mock fetch
global.fetch = jest.fn();

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
    messages: [
      { id: "1", body: "Hello everyone!", user_id: "1" },
      { id: "2", body: "Hi there!", user_id: "2" },
    ],
    members: [
      { id: "1", name: "Alice", avatar_url: "alice_avatar.png", membership_id: "m1" },
      { id: "2", name: "Bob", avatar_url: "bob_avatar.png", membership_id: "m2" },
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
  const mockHandleMemberRemoved = jest.fn();
  const mockHandleConversationDeleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockReset();
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
    const emptyConversation = {
      id: "1",
      topic: "Empty Chat",
      messages: [],
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
    // Mock the fetch response for fetching users
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: "ok",
          users: [{ id: "3", name: "Charlie", email: "charlie@example.com" }],
        }),
    });

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

    // Mock the fetch response for adding a user
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: "created",
          member: {
            id: "3",
            name: "Charlie",
            email: "charlie@example.com",
          },
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

    await waitFor(() => {
      // Assert the API call
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/conversation_users",
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

  it("closes user selection when cancel is clicked", async () => {
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
    // Mock the fetch response for removing a member
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: "ok",
          removed_user_id: "2",
        }),
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
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/conversation_users/m2",
        expect.objectContaining({
          method: "DELETE",
        })
      );
      // Verify callback
      expect(mockHandleNotificationChange).toHaveBeenCalledWith("Member removed");
      expect(mockHandleMemberRemoved).toHaveBeenCalledWith("2");
    });
  });

  it("calls handleConversationDeleted when removing last member", async () => {
    // Mock the fetch response for removing the last member (conversation deleted)
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: "ok",
          conversation_deleted: true,
        }),
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
    // Mock the fetch response for leaving conversation
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: "ok",
        }),
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
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/conversation_users/m1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
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
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends a message successfully", async () => {
    // Mock the fetch response for sending a message
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: "created",
          message: {
            id: "3",
            body: "Test message",
            user_id: "1",
            conversation_id: "1",
          },
        }),
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
    fireEvent.change(screen.getByTestId("quill-editor"), {
      target: { value: "Hello!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/messages",
        expect.objectContaining({
          method: "POST",
        })
      );
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

  it("shows error notification when send message fails", async () => {
    // Mock the fetch response to throw an error
    global.fetch.mockRejectedValueOnce(new Error("Network error"));

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
    fireEvent.change(screen.getByTestId("quill-editor"), {
      target: { value: "Hello!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(mockHandleNotificationChange).toHaveBeenCalledWith("Failed to send message");
    });
  });

  it("shows removing/loading state when removing a member", async () => {
    // Mock a slow fetch response
    global.fetch.mockImplementation(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            json: () => Promise.resolve({ status: "ok", removed_user_id: "2" }),
          });
        }, 100);
      })
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
    // Mock a slow fetch response
    global.fetch.mockImplementation(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            json: () => Promise.resolve({ status: "ok" }),
          });
        }, 100);
      })
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
