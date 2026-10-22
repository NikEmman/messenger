require 'rails_helper'

RSpec.describe ResetDemoDataJob, type: :job do
  before { allow($stdout).to receive(:puts) } # the seeds print a summary

  def seed
    Rails.application.load_seed
  end

  describe '.due?' do
    it 'is due when there are no users' do
      expect(described_class).to be_due
    end

    it 'is due once the oldest user is over a day old' do
      create(:user, created_at: 25.hours.ago)
      expect(described_class).to be_due
    end

    it 'is not due within a day of the last reset' do
      create(:user, created_at: 23.hours.ago)
      expect(described_class).not_to be_due
    end
  end

  it 'removes visitor users, conversations and messages' do
    seed
    visitor = create(:user, :with_profile)
    conversation = create(:conversation)
    create(:conversation_user, user: visitor, conversation: conversation)
    create(:message, user: visitor, conversation: conversation)

    described_class.perform_now

    expect(User.exists?(email: visitor.email)).to be false
    expect(Conversation.exists?(conversation.id)).to be false
    expect(Message.where(seeded: false)).to be_empty
  end

  it 'restores seeded data that visitors changed or deleted' do
    seed
    batman = User.find_by!(email: 'bruce.wayne@wayneenterprises.com')
    batman.profile.update!(address: 'Somewhere offensive')
    Conversation.first.destroy!

    described_class.perform_now

    expect(User.count).to eq(3)
    expect(Conversation.count).to eq(3)
    expect(Message.count).to eq(14)
    expect(User.find_by!(email: batman.email).profile.address).to eq('1007 Mountain Drive, Gotham City')
  end
end
