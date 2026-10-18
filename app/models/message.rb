class Message < ApplicationRecord
  has_rich_text :body
  belongs_to :user
  belongs_to :conversation

  validates :body, presence: true
end
