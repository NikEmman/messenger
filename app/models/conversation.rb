class Conversation < ApplicationRecord
  has_many :messages, dependent: :destroy
  has_many :conversation_users, dependent: :destroy
  has_many :users, through: :conversation_users
  validates :topic, presence: true

  scope :by_recent_activity, -> { order(Arel.sql("COALESCE(conversations.last_message_at, conversations.created_at) DESC")) }
end
