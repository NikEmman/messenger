class ConversationUser < ApplicationRecord
  belongs_to :user
  belongs_to :conversation

  validates :user_id, uniqueness: { scope: :conversation_id, message: "is already a member" }
end
