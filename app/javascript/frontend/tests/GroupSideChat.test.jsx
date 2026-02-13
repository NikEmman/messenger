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

  it("renders topic if available", () => {
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

  it("renders member names if topic is not available", () => {
    const conversationWithoutTopic = { ...mockConversation, topic: "" };
    render(
      <GroupChatSide
        conversation={conversationWithoutTopic}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    const bobAvatar = screen.getByAltText("avatar");
    expect(bobAvatar).toHaveAttribute("src", "bob_avatar.png");
  });

  it("triggers onClick when paragraph is clicked", () => {
    render(
      <GroupChatSide
        conversation={mockConversation}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );
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

  it("shows member name when only current user is in conversation with no topic", () => {
    const singleMemberConversation = {
      id: "1",
      topic: "",
      members: [
        { id: "1", name: "Alice", avatar_url: "alice_avatar.png" },
      ],
    };

    render(
      <GroupChatSide
        conversation={singleMemberConversation}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("filters out current user's avatar when displaying members", () => {
    const conversationWithoutTopic = { ...mockConversation, topic: "" };
    
    render(
      <GroupChatSide
        conversation={conversationWithoutTopic}
        user={mockUser}
        onClick={mockOnClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    // Should only have one avatar (Bob's), not Alice's
    const avatars = screen.getAllByAltText("avatar");
    expect(avatars).toHaveLength(1);
    expect(avatars[0]).toHaveAttribute("src", "bob_avatar.png");
  });

  it("displays multiple member avatars when no topic", () => {
    const multiMemberConversation = {
      id: "1",
      topic: "",
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

    // Should have 2 avatars (Bob's and Charlie's), not Alice's
    const avatars = screen.getAllByAltText("avatar");
    expect(avatars).toHaveLength(2);
  });

  it("does not render any avatar when all members are filtered out", () => {
    const currentUserOnlyConversation = {
      id: "1",
      topic: "",
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

    // Should not render any avatar since only current user exists
    expect(screen.queryByAltText("avatar")).not.toBeInTheDocument();
  });
});
