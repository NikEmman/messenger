class Message < ApplicationRecord
  has_rich_text :body
  belongs_to :user
  belongs_to :conversation

  validates :body, presence: true

  after_create :bump_conversation_activity

  RETENTION = 1.week

  # Visitor messages past the retention window; seeded demo messages are kept.
  scope :expired, -> { where(seeded: false).where(created_at: ...RETENTION.ago) }

  # The newest message of each given conversation, in a single query.
  def self.latest_per_conversation(conversation_ids)
    where(id: where(conversation_id: conversation_ids).group(:conversation_id).select("MAX(messages.id)"))
      .with_rich_text_body
  end

  # { conversation_id => count } of messages from others the user hasn't read yet.
  def self.unread_counts_for(user)
    joins(conversation: :conversation_users)
      .where(conversation_users: { user_id: user.id })
      .where.not(user_id: user.id)
      .where("conversation_users.last_read_at IS NULL OR messages.created_at > conversation_users.last_read_at")
      .group(:conversation_id)
      .count
  end

  def preview
    body.to_plain_text.squish.truncate(100)
  end

  private

  def bump_conversation_activity
    conversation.update_column(:last_message_at, created_at)
  end
end
