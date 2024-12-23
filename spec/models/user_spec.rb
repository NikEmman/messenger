# spec/models/user_spec.rb
require 'rails_helper'

RSpec.describe User, type: :model do
  describe "validations" do
    it "is valid with valid attributes" do
      expect(build(:user)).to be_valid
    end

    it "is not valid without a name" do
      user = build(:user, name: nil)
      expect(user).not_to be_valid
      expect(user.errors[:name]).to include("can't be blank")
    end

    it "is not valid without an email" do
      user = build(:user, email: nil)
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("can't be blank")
    end

    it "is not valid with a duplicate email" do
      create(:user, email: "test@example.com")
      user = build(:user, email: "test@example.com")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("has already been taken")
    end

    it "is not valid with an invalid email" do
      user = build(:user, email: "invalid_email")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("is invalid")
    end

    it "is not valid without a password" do
      user = build(:user, password: nil)
      expect(user).not_to be_valid
      expect(user.errors[:password]).to include("can't be blank")
    end

    it "is not valid if password is too short" do
      user = build(:user, password: "short", password_confirmation: "short")
      expect(user).not_to be_valid
      expect(user.errors[:password]).to include("is too short (minimum is 6 characters)")
    end

    it "is not valid without password confirmation when password is present" do
      user = build(:user, password_confirmation: nil)
      expect(user).not_to be_valid
      expect(user.errors[:password_confirmation]).to include("can't be blank")
    end

    it "is not valid if password and password confirmation do not match" do
      user = build(:user, password_confirmation: "different_password")
      expect(user).not_to be_valid
      expect(user.errors[:password_confirmation]).to include("doesn't match Password")
    end
  end

  describe "associations" do
    it "can have many messages" do
      user = create(:user, :with_messages)
      expect(user.messages.count).to eq(2)
    end

    it "can have one profile" do
      user = create(:user, :with_profile)
      expect(user.profile).to be_present
      expect(user.profile.address).to eq("123 Main St")
    end

    it "can have many conversations through conversation_user" do
      user = create(:user, :with_conversations)
      expect(user.conversations.count).to eq(2)
    end
  end

  describe "secure password" do
    let(:user) { create(:user) }

    it "authenticates with correct password" do
      expect(user.authenticate("password123")).to be_truthy
    end

    it "does not authenticate with incorrect password" do
      expect(user.authenticate("wrong_password")).to be_falsey
    end
  end
end
