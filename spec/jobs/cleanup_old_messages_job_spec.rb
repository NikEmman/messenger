require 'rails_helper'

RSpec.describe CleanupOldMessagesJob, type: :job do
  let(:conversation) { create(:conversation) }

  it 'destroys visitor messages older than a week along with their rich text' do
    old = create(:message, conversation: conversation, created_at: 8.days.ago)

    expect { described_class.perform_now }
      .to change(Message, :count).by(-1)
      .and change(ActionText::RichText, :count).by(-1)
    expect(Message.exists?(old.id)).to be false
  end

  it 'keeps recent messages and seeded demo messages' do
    recent = create(:message, conversation: conversation, created_at: 2.days.ago)
    seeded = create(:message, conversation: conversation, created_at: 1.month.ago, seeded: true)

    described_class.perform_now

    expect(Message.where(id: [ recent.id, seeded.id ]).count).to eq(2)
  end

  it "refreshes the affected conversations' activity timestamp" do
    kept = create(:message, conversation: conversation, created_at: 10.days.ago, seeded: true)
    create(:message, conversation: conversation, created_at: 8.days.ago)

    described_class.perform_now

    expect(conversation.reload.last_message_at).to be_within(1.second).of(kept.created_at)
  end
end
