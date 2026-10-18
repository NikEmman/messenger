require 'rails_helper'

RSpec.describe InboxChannel, type: :channel do
  let(:user) { create(:user) }
  let(:friend) { create(:user) }
  let(:stranger) { create(:user) }
  let(:conversation) { create(:conversation) }

  before do
    create(:conversation_user, user: user, conversation: conversation)
    create(:conversation_user, user: friend, conversation: conversation)
    stub_connection current_user: user
  end

  it "streams the user's own inbox and marks them online" do
    subscribe

    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_for(user)
    expect(user.reload).to be_online
  end

  it 'announces presence only to people who share a conversation' do
    expect { subscribe }
      .to have_broadcasted_to(InboxChannel.broadcasting_for(friend)).with(type: "presence", user_id: user.id, online: true)
      .and have_broadcasted_to(InboxChannel.broadcasting_for(stranger)).exactly(0).times
  end

  it 'marks the user offline when they disconnect' do
    subscribe

    expect { unsubscribe }
      .to have_broadcasted_to(InboxChannel.broadcasting_for(friend)).with(type: "presence", user_id: user.id, online: false)
    expect(user.reload).not_to be_online
  end

  describe '#typing' do
    before { subscribe }

    it 'relays typing to the other members' do
      expect { perform :typing, conversation_id: conversation.id }
        .to have_broadcasted_to(InboxChannel.broadcasting_for(friend))
        .with(type: "typing", conversation_id: conversation.id, user_id: user.id)
    end

    it 'ignores conversations the user is not in' do
      other = create(:conversation)
      create(:conversation_user, user: stranger, conversation: other)

      expect { perform :typing, conversation_id: other.id }
        .not_to have_broadcasted_to(InboxChannel.broadcasting_for(stranger))
    end
  end
end
