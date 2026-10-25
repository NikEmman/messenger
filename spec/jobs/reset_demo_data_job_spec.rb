require 'rails_helper'

RSpec.describe ResetDemoDataJob, type: :job do
  let(:batman) { User.find_by!(email: 'bruce.wayne@wayneenterprises.com') }
  let(:superman) { User.find_by!(email: 'clark.kent@dailyplanet.com') }

  before { DemoData.seed! }

  # A visitor used the demo account (seeded an hour ago) and left `ago`.
  def used(user, ago: 31.minutes)
    user.update_columns(created_at: 1.hour.ago, last_seen_at: ago.ago)
  end

  describe '.due?' do
    it 'is due when a demo account is missing' do
      batman.update_columns(email: 'renamed@example.com')
      expect(described_class).to be_due
    end

    it 'is not due when the demo accounts are untouched since the last reset' do
      expect(described_class).not_to be_due
    end

    it 'is due once a used demo account has been idle long enough' do
      used(batman)
      expect(described_class).to be_due
    end

    it 'is not due while any demo account was seen recently' do
      used(batman)
      used(superman, ago: 5.minutes)
      expect(described_class).not_to be_due
    end
  end

  describe '.schedule' do
    include ActiveJob::TestHelper

    after { Rails.configuration.x.reset_demo_data = nil }

    it 'queues a reset for after the idle period when enabled' do
      Rails.configuration.x.reset_demo_data = true
      expect { described_class.schedule }
        .to have_enqueued_job(described_class).at(a_value_within(5.seconds).of(30.minutes.from_now))
    end

    it 'does nothing when disabled' do
      expect { described_class.schedule }.not_to have_enqueued_job(described_class)
    end
  end

  describe '#perform' do
    it 'does nothing unless due' do
      expect { described_class.perform_now }.not_to change { batman.reload.id }
    end

    context 'when due' do
      before { used(batman) }

      it 'restores the seeded accounts, profiles and conversations' do
        batman.profile.update!(address: 'Somewhere offensive')
        Conversation.find_by!(topic: 'Hero Strategies and City Protection').destroy!
        create(:message, user: batman, conversation: Conversation.first)

        described_class.perform_now

        expect(User.count).to eq(3)
        expect(Conversation.count).to eq(3)
        expect(Message.count).to eq(14)
        expect(User.find_by!(email: batman.email).profile.address).to eq('1007 Mountain Drive, Gotham City')
      end

      it 'deletes conversations left with no members' do
        conversation = create(:conversation)
        create(:conversation_user, user: batman, conversation: conversation)
        create(:conversation_user, user: superman, conversation: conversation)

        described_class.perform_now

        expect(Conversation.exists?(conversation.id)).to be false
      end

      it "keeps other users, their conversations and their messages" do
        visitor = create(:user, :with_profile)
        conversation = create(:conversation)
        create(:conversation_user, user: visitor, conversation: conversation)
        create(:conversation_user, user: batman, conversation: conversation)
        visitor_message = create(:message, user: visitor, conversation: conversation)
        create(:message, user: batman, conversation: conversation)

        described_class.perform_now

        expect(User.exists?(visitor.id)).to be true
        expect(conversation.reload.users).to contain_exactly(visitor)
        expect(conversation.messages).to contain_exactly(visitor_message)
        expect(conversation.last_message_at).to eq(visitor_message.created_at)
      end

      it "removes demo messages from conversations the demo account already left" do
        visitor = create(:user)
        conversation = create(:conversation)
        create(:conversation_user, user: visitor, conversation: conversation)
        create(:message, user: batman, conversation: conversation)

        described_class.perform_now

        expect(conversation.messages).to be_empty
      end

      it 'tells the remaining members live' do
        visitor = create(:user)
        conversation = create(:conversation)
        create(:conversation_user, user: visitor, conversation: conversation)
        create(:conversation_user, user: batman, conversation: conversation)
        visitor_message = create(:message, user: visitor, conversation: conversation)
        create(:message, user: batman, conversation: conversation)

        expect { described_class.perform_now }
          .to have_broadcasted_to(InboxChannel.broadcasting_for(visitor)).with(
            hash_including(type: 'users_removed', conversation_id: conversation.id,
                           last_message: hash_including(id: visitor_message.id), unread_count: 0)
          )
      end
    end
  end
end
