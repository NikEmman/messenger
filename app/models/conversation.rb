class Conversation < ApplicationRecord
  has_many :messages, dependent: :destroy
  has_many :conversation_users, dependent: :destroy
  has_many :users, through: :conversation_users
  validates :topic, presence: true
end
