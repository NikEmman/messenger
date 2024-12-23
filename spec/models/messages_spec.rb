# spec/models/message_spec.rb
require 'rails_helper'

RSpec.describe Message, type: :model do
  describe "associations" do
    it "belongs to a user" do
      message = build(:message)
      expect(message.user).to be_present
    end

    it "belongs to a conversation" do
      message = build(:message)
      expect(message.conversation).to be_present
    end
  end

  describe "validations" do
    it "is not valid without a user" do
      message = build(:message, user: nil)
      expect(message).not_to be_valid
      expect(message.errors[:user]).to include("must exist")
    end

    it "is not valid without a conversation" do
      message = build(:message, conversation: nil)
      expect(message).not_to be_valid
      expect(message.errors[:conversation]).to include("must exist")
    end
  end

  describe "rich text body" do
    it "can be created with rich text content" do
      message = create(:message, :with_rich_text)
      expect(message.body).to be_present
      expect(message.body.body.to_plain_text).to include("rich text")
    end

    it "can be created with plain text content" do
      message = create(:message, :with_plain_text)
      expect(message.body).to be_present
      expect(message.body.body.to_plain_text).to eq("Plain text message")
    end

    it "preserves formatting in rich text content" do
      message = create(:message, :with_rich_text)
      expect(message.body.to_trix_html).to include('<strong>rich text</strong>')
    end

    it "can handle empty content" do
      message = create(:message)
      expect(message).to be_valid
    end
  end
end
