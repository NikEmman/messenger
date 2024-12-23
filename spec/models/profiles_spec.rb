# spec/models/profile_spec.rb
require 'rails_helper'

RSpec.describe Profile, type: :model do
  describe "associations" do
    it "belongs to a user" do
      expect(build(:profile).user).to be_present
    end

    it "can have an avatar attached" do
      profile = create(:profile, :with_avatar)
      expect(profile.avatar).to be_attached
    end
  end

  describe "attachments" do
    it "can be created without an avatar" do
      profile = create(:profile)
      expect(profile).to be_valid
      expect(profile.avatar).not_to be_attached
    end

    it "accepts valid image attachments" do
      profile = create(:profile, :with_avatar)
      expect(profile.avatar.content_type).to start_with 'image/'
    end
  end

  describe "user association" do
    it "is not valid without a user" do
      profile = build(:profile, user: nil)
      expect(profile).not_to be_valid
      expect(profile.errors[:user]).to include("must exist")
    end

    it "is destroyed when user is destroyed" do
      profile = create(:profile)
      user = profile.user

      expect { user.destroy }.to change { Profile.count }.by(-1)
    end
  end

  describe "avatar handling" do
    let(:profile) { create(:profile) }

    it "can attach an avatar" do
      profile.avatar.attach(
        io: File.open(Rails.root.join('spec', 'fixtures', 'files', 'test_avatar.jpg')),
        filename: 'test_avatar.jpg',
        content_type: 'image/jpeg'
      )
      expect(profile.avatar).to be_attached
    end

    it "can replace an existing avatar" do
      # Attach initial avatar
      profile.avatar.attach(
        io: File.open(Rails.root.join('spec', 'fixtures', 'files', 'test_avatar.jpg')),
        filename: 'test_avatar.jpg',
        content_type: 'image/jpeg'
      )

      # Attach new avatar
      profile.avatar.attach(
        io: File.open(Rails.root.join('spec', 'fixtures', 'files', 'new_avatar.jpg')),
        filename: 'new_avatar.jpg',
        content_type: 'image/jpeg'
      )

      expect(profile.avatar.filename.to_s).to eq 'new_avatar.jpg'
    end

    it "can remove an avatar" do
      profile = create(:profile, :with_avatar)
      expect(profile.avatar).to be_attached

      profile.avatar.purge
      expect(profile.avatar).not_to be_attached
    end
  end
end
