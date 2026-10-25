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

  it 'stays online while another tab is still connected' do
    subscribe
    user.update_column(:cable_connections, 2) # a second tab subscribed

    expect { unsubscribe }
      .not_to have_broadcasted_to(InboxChannel.broadcasting_for(friend))
    expect(user.reload).to be_online
  end

  describe 'demo account reset' do
    before do
      allow(ResetDemoDataJob).to receive(:schedule)
      subscribe
    end

    it 'is scheduled when a demo account disconnects' do
      user.update_column(:email, DemoData::EMAILS.first)
      unsubscribe

      expect(ResetDemoDataJob).to have_received(:schedule)
    end

    it 'is not scheduled for other users' do
      unsubscribe

      expect(ResetDemoDataJob).not_to have_received(:schedule)
    end
  end

  it 'does not re-announce a user who is already online in another tab' do
    user.update_columns(cable_connections: 1, last_seen_at: Time.current)

    expect { subscribe }
      .not_to have_broadcasted_to(InboxChannel.broadcasting_for(friend))
    expect(user.reload.cable_connections).to eq(2)
  end

  it 'discards stale connection counts left by a crashed server' do
    user.update_columns(cable_connections: 3, last_seen_at: 10.minutes.ago)

    expect { subscribe }
      .to have_broadcasted_to(InboxChannel.broadcasting_for(friend)).with(type: "presence", user_id: user.id, online: true)
    expect(user.reload.cable_connections).to eq(1)
  end

  it 'heartbeats keep the user online and bring them back if they lapsed' do
    subscribe
    user.update_column(:last_seen_at, 2.minutes.ago)

    expect { perform :appear }
      .to have_broadcasted_to(InboxChannel.broadcasting_for(friend)).with(type: "presence", user_id: user.id, online: true)
    expect(user.reload).to be_online
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
