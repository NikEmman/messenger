require 'rails_helper'

RSpec.describe ConversationUser, type: :model do
  describe "associations" do
    it "belongs to a user" do
      conversation_user = build(:conversation_user)
      expect(conversation_user.user).to be_present
    end

    it "belongs to a conversation" do
      conversation_user = build(:conversation_user)
      expect(conversation_user.conversation).to be_present
    end
  end

  describe "validations" do
    it "is valid with valid attributes" do
      conversation_user = build(:conversation_user)
      expect(conversation_user).to be_valid
    end

    it "is not valid without a user" do
      conversation_user = build(:conversation_user, user: nil)
      expect(conversation_user).not_to be_valid
      expect(conversation_user.errors[:user]).to include("must exist")
    end

    it "is not valid without a conversation" do
      conversation_user = build(:conversation_user, conversation: nil)
      expect(conversation_user).not_to be_valid
      expect(conversation_user.errors[:conversation]).to include("must exist")
    end
  end

  describe "dependency behavior" do
    let!(:conversation_user) { create(:conversation_user) }

    it "is destroyed when user is destroyed" do
      user = conversation_user.user
      expect {
        user.destroy
      }.to change { ConversationUser.count }.by(-1)
    end

    it "is destroyed when conversation is destroyed" do
      conversation = conversation_user.conversation
      expect {
        conversation.destroy
      }.to change { ConversationUser.count }.by(-1)
    end
  end

  describe "scopes and queries" do
    let(:user) { create(:user) }
    let(:conversation) { create(:conversation) }

    before do
      create(:conversation_user, user: user, conversation: conversation)
    end

    it "can find conversation users by user" do
      expect(ConversationUser.where(user: user)).to exist
    end

    it "can find conversation users by conversation" do
      expect(ConversationUser.where(conversation: conversation)).to exist
    end

    it "can find all conversations for a user" do
      conversations = ConversationUser.where(user: user).map(&:conversation)
      expect(conversations).to include(conversation)
    end

    it "can find all users in a conversation" do
      users = ConversationUser.where(conversation: conversation).map(&:user)
      expect(users).to include(user)
    end
  end
end
