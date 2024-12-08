class User < ApplicationRecord
  has_secure_password

  validates_presence_of :email
  validates_uniqueness_of :email
  validates_presence_of :name
  has_many :conversations, through: :conversation_user
  has_many :messages
  has_many :conversation_user
end
