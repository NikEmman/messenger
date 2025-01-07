import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom"; // Ensure this is imported
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
});
