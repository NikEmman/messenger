class Conversation < ApplicationRecord
  has_many :messages, dependent: :destroy
  has_many :conversation_users, dependent: :destroy
  has_many :users, through: :conversation_users
  validates :topic, presence: true

  def refresh_last_message_at
    update_column(:last_message_at, messages.maximum(:created_at))
  end

  scope :by_recent_activity, -> { order(Arel.sql("COALESCE(conversations.last_message_at, conversations.created_at) DESC")) }
end
