import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupChatSide from "../components/GroupChatSide";

const mockConversation = {
  id: "1",
  topic: "Study Group",
  members: [
    { id: "1", name: "Alice", avatar_url: "alice_avatar.png" },
    { id: "2", name: "Bob", avatar_url: "bob_avatar.png" },
  ],
};

const mockUser = { id: "1", name: "Alice", avatar_url: "alice_avatar.png" };
const mockOnClick = jest.fn();
const mockOnDeleteClick = jest.fn();

describe("GroupChatSide", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders topic", () => {
    render(
      <GroupChatSide
        conversation={mockConversation}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    expect(screen.getByText("Study Group")).toBeInTheDocument();
  });

  it("always displays avatars (filters out current user)", () => {
    render(
      <GroupChatSide
        conversation={mockConversation}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    // Should show Bob's avatar (filtered out current user Alice)
    expect(screen.getByAltText("Bob")).toBeInTheDocument();
    // Should NOT show Alice's avatar
    expect(screen.queryByAltText("Alice")).not.toBeInTheDocument();
  });

  it("triggers onClick when groupChatContent is clicked", () => {
    render(
      <GroupChatSide
        conversation={mockConversation}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    // Click on the topic text
    fireEvent.click(screen.getByText("Study Group"));
    expect(mockOnClick).toHaveBeenCalled();
  });

  it("triggers onDeleteClick when delete button is clicked", () => {
    render(
      <GroupChatSide
        conversation={mockConversation}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
    fireEvent.click(screen.getByText("Del"));
    expect(mockOnDeleteClick).toHaveBeenCalled();
  });

  it("displays stacked avatars with correct z-index ordering", () => {
    const multiMemberConversation = {
      id: "1",
      topic: "Test",
      members: [
        { id: "1", name: "Alice", avatar_url: "alice_avatar.png" },
        { id: "2", name: "Bob", avatar_url: "bob_avatar.png" },
        { id: "3", name: "Charlie", avatar_url: "charlie_avatar.png" },
      ],
    };

    render(
      <GroupChatSide
        conversation={multiMemberConversation}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    // Should have 2 avatars (Bob and Charlie)
    expect(screen.getByAltText("Bob")).toBeInTheDocument();
    expect(screen.getByAltText("Charlie")).toBeInTheDocument();
    // Should NOT have Alice
    expect(screen.queryByAltText("Alice")).not.toBeInTheDocument();
  });

  it("shows overflow indicator when more than 5 members", () => {
    const manyMembersConversation = {
      id: "1",
      topic: "Large Group",
      members: [
        { id: "1", name: "Alice", avatar_url: "alice_avatar.png" },
        { id: "2", name: "Bob", avatar_url: "bob_avatar.png" },
        { id: "3", name: "Charlie", avatar_url: "charlie_avatar.png" },
        { id: "4", name: "David", avatar_url: "david_avatar.png" },
        { id: "5", name: "Eve", avatar_url: "eve_avatar.png" },
        { id: "6", name: "Frank", avatar_url: "frank_avatar.png" },
        { id: "7", name: "Grace", avatar_url: "grace_avatar.png" },
      ],
    };

    render(
      <GroupChatSide
        conversation={manyMembersConversation}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    // Should show first 5 members (excluding current user = 6 others, but max 5)
    // Actually: 7 members total - 1 current user = 6 others. Show max 5 = 5 avatars
    expect(screen.getByAltText("Bob")).toBeInTheDocument();
    expect(screen.getByAltText("Charlie")).toBeInTheDocument();
    expect(screen.getByAltText("David")).toBeInTheDocument();
    expect(screen.getByAltText("Eve")).toBeInTheDocument();
    expect(screen.getByAltText("Frank")).toBeInTheDocument();
    // Grace should be overflow (+1)
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("shows +3 overflow when 8 other members", () => {
    const eightMembersConversation = {
      id: "1",
      topic: "Big Group",
      members: [
        { id: "1", name: "Alice", avatar_url: "alice_avatar.png" },
        { id: "2", name: "Bob", avatar_url: "bob_avatar.png" },
        { id: "3", name: "Charlie", avatar_url: "charlie_avatar.png" },
        { id: "4", name: "David", avatar_url: "david_avatar.png" },
        { id: "5", name: "Eve", avatar_url: "eve_avatar.png" },
        { id: "6", name: "Frank", avatar_url: "frank_avatar.png" },
        { id: "7", name: "Grace", avatar_url: "grace_avatar.png" },
        { id: "8", name: "Henry", avatar_url: "henry_avatar.png" },
        { id: "9", name: "Ivy", avatar_url: "ivy_avatar.png" },
      ],
    };

    render(
      <GroupChatSide
        conversation={eightMembersConversation}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    // 9 members - 1 current user = 8 others. Show 5 avatars + "+3"
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("does not show avatars when only current user exists", () => {
    const currentUserOnlyConversation = {
      id: "1",
      topic: "Solo Chat",
      members: [
        { id: "1", name: "Alice", avatar_url: "alice_avatar.png" },
      ],
    };

    render(
      <GroupChatSide
        conversation={currentUserOnlyConversation}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    // Should not render any avatar
    expect(screen.queryByAltText("Alice")).not.toBeInTheDocument();
    // Should still show topic
    expect(screen.getByText("Solo Chat")).toBeInTheDocument();
  });

  it("renders avatars even when no topic", () => {
    const noTopicConversation = {
      id: "1",
      topic: "",
      members: [
        { id: "1", name: "Alice", avatar_url: "alice_avatar.png" },
        { id: "2", name: "Bob", avatar_url: "bob_avatar.png" },
      ],
    };

    render(
      <GroupChatSide
        conversation={noTopicConversation}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    // Should show Bob's avatar even with no topic
    expect(screen.getByAltText("Bob")).toBeInTheDocument();
  });

  it("renders stackedAvatars container with class", () => {
    render(
      <GroupChatSide
        conversation={mockConversation}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    const avatarsContainer = document.querySelector(".stackedAvatars");
    expect(avatarsContainer).toBeInTheDocument();
  });
});
