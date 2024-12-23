class User < ApplicationRecord
  has_secure_password

  validates :password, length: { minimum: 6 }
  validates :password_confirmation, presence: true, if: -> { password.present? }
  validates :email, presence: true, format: { with: /\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\z/i }
  validates_uniqueness_of :email
  validates_presence_of :name

  has_many :messages
  has_many :conversation_user, dependent: :destroy
  has_many :conversations, through: :conversation_user
  has_one :profile, dependent: :destroy
end
