# spec/models/conversation_spec.rb
require 'rails_helper'

RSpec.describe Conversation, type: :model do
  describe "associations" do
    it "has many messages" do
      conversation = create(:conversation, :with_messages)
      expect(conversation.messages.count).to eq(3)
    end

    it "has many conversation_users" do
      conversation = create(:conversation, :with_users)
      expect(conversation.conversation_users.count).to eq(2)
    end

    it "has many users through conversation_users" do
      conversation = create(:conversation, :with_users)
      expect(conversation.users.count).to eq(2)
    end
  end

  describe "dependent destroy" do
    let!(:users) { create_list(:user, 2) }
    let(:conversation) do
      conv = create(:conversation)
      users.each do |user|
        create(:conversation_user, conversation: conv, user: user)
        create(:message, conversation: conv, user: user)
      end
      conv
    end

    it "has the expected number of associated records before destroy" do
      expect(conversation.messages.count).to eq(2)
      expect(conversation.conversation_users.count).to eq(2)
      expect(conversation.users.count).to eq(2)
    end

    it "deletes associated messages when conversation is destroyed" do
      message_count = conversation.messages.count
      expect {
        conversation.destroy
      }.to change { Message.count }.by(-message_count)
    end

    it "deletes associated conversation_users when conversation is destroyed" do
      conversation_user_count = conversation.conversation_users.count
      expect {
        conversation.destroy
      }.to change { ConversationUser.count }.by(-conversation_user_count)
    end

    it "does not delete associated users when conversation is destroyed" do
      initial_user_count = User.count
      conversation.destroy
      expect(User.count).to eq(initial_user_count)
    end
  end

  describe "user management" do
    let(:conversation) { create(:conversation) }
    let(:user) { create(:user) }

    it "can add users to the conversation" do
      conversation.users << user
      expect(conversation.users).to include(user)
    end

    it "allows multiple users in the same conversation" do
      users = create_list(:user, 3)
      users.each { |user| conversation.users << user }
      expect(conversation.users.count).to eq(3)
    end
  end

  describe "message management" do
    let(:conversation) { create(:conversation) }
    let(:user) { create(:user) }

    before do
      conversation.users << user
    end

    it "can add new messages" do
      message = conversation.messages.create(user: user, body: "Hello")
      expect(conversation.messages).to include(message)
    end

    it "orders messages by created_at by default" do
      older_message = create(:message, conversation: conversation, user: user, created_at: 2.days.ago)
      newer_message = create(:message, conversation: conversation, user: user, created_at: 1.day.ago)

      expect(conversation.messages.first).to eq(older_message)
      expect(conversation.messages.last).to eq(newer_message)
    end
  end

  describe "conversation state" do
    let(:conversation) { create(:conversation) }

    it "exists without any messages" do
      expect(conversation.messages).to be_empty
      expect(conversation).to be_valid
    end

    it "exists without any users" do
      expect(conversation.users).to be_empty
      expect(conversation).to be_valid
    end
  end

  describe "user participation" do
    let(:conversation) { create(:conversation) }
    let(:user) { create(:user) }

    it "tracks if a user is part of the conversation" do
      expect(conversation.users).not_to include(user)
      conversation.users << user
      expect(conversation.users).to include(user)
    end
  end
end
