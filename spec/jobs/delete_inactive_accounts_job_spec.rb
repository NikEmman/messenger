require 'rails_helper'

RSpec.describe DeleteInactiveAccountsJob, type: :job do
  def user_seen(ago)
    create(:user, created_at: 1.month.ago, last_seen_at: ago&.ago)
  end

  it 'deletes accounts unused for over two weeks, with their messages' do
    inactive = user_seen(15.days)
    create(:message, user: inactive)

    described_class.perform_now

    expect(User.exists?(inactive.id)).to be false
    expect(Message.where(user_id: inactive.id)).to be_empty
  end

  it 'keeps accounts seen within two weeks' do
    active = user_seen(13.days)

    described_class.perform_now

    expect(User.exists?(active.id)).to be true
  end

  it 'judges accounts that never connected by when they signed up' do
    old = user_seen(nil)
    fresh = create(:user, created_at: 1.day.ago)

    described_class.perform_now

    expect(User.exists?(old.id)).to be false
    expect(User.exists?(fresh.id)).to be true
  end

  it 'leaves the demo accounts alone' do
    DemoData.seed!
    DemoData.users.update_all(last_seen_at: 1.month.ago)

    described_class.perform_now

    expect(DemoData.users.count).to eq(DemoData::EMAILS.size)
  end

  it 'keeps shared conversations for the remaining members and tells them live' do
    inactive = user_seen(15.days)
    visitor = create(:user)
    conversation = create(:conversation)
    create(:conversation_user, user: inactive, conversation: conversation)
    create(:conversation_user, user: visitor, conversation: conversation)
    create(:message, user: inactive, conversation: conversation)

    expect { described_class.perform_now }
      .to have_broadcasted_to(InboxChannel.broadcasting_for(visitor)).with(
        hash_including(type: 'users_removed', conversation_id: conversation.id, user_ids: [ inactive.id ])
      )
    expect(conversation.reload.users).to contain_exactly(visitor)
    expect(conversation.messages).to be_empty
  end
end
