class Message < ApplicationRecord
  has_rich_text :body, dependent: :destroy
  belongs_to :user
  belongs_to :conversation
end
