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
import Messages from "../components/Messages";
import { AppContext } from "../components/AppContext";

// Mock fetch
global.fetch = jest.fn();

// Helper function to render Messages with required providers
const renderMessages = (contextValue) => {
  return render(
    <BrowserRouter>
      <AppContext.Provider value={contextValue}>
        <Messages />
      </AppContext.Provider>
    </BrowserRouter>
  );
};

describe("Messages Component", () => {
  const defaultContextValue = {
    user: { id: "1", name: "Alice", avatar_url: "alice_avatar.png" },
    loggedInStatus: "LOGGED_IN",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the list of conversations", async () => {
    const mockConversations = [
      { id: "1", topic: "Project Discussion", messages: [], members: [] },
    ];

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ conversations: mockConversations }),
      })
    );

    await act(async () => {
      renderMessages(defaultContextValue);
    });

    // The conversation should be rendered in the aside element
    const aside = screen.getByRole("complementary");
    expect(aside).toHaveTextContent("Project Discussion");
  });

  it("shows no conversations message when there are no conversations", async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ conversations: [] }),
      })
    );

    await act(async () => {
      renderMessages(defaultContextValue);
    });

    expect(screen.getByText("No conversations available")).toBeInTheDocument();
  });

  it("shows the select conversation message when no conversation is selected", async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ conversations: [] }),
      })
    );

    await act(async () => {
      renderMessages(defaultContextValue);
    });

    expect(screen.getByText("Select a conversation")).toBeInTheDocument();
  });

  it("deletes a conversation", async () => {
    const mockConversations = [
      { id: "1", topic: "Project Discussion", messages: [], members: [] },
    ];

    global.fetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve({ conversations: mockConversations }),
        })
      )
      .mockImplementationOnce(() => Promise.resolve({ ok: true }));

    await act(async () => {
      renderMessages(defaultContextValue);
    });

    const deleteButton = screen.getByRole("button", { name: /del/i });

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Conversation deleted successfully")
      ).toBeInTheDocument();
    });
  });

  it("redirects to home when not logged in", async () => {
    const notLoggedInContext = {
      ...defaultContextValue,
      loggedInStatus: "NOT_LOGGED_IN",
    };

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ conversations: [] }),
      })
    );

    await act(async () => {
      renderMessages(notLoggedInContext);
    });

    expect(window.location.pathname).toBe("/");
  });
});
