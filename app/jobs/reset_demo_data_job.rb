class ResetDemoDataJob < ApplicationJob
  queue_as :default

  RESET_EVERY = 1.day

  # The seeds recreate every user, so the oldest one dates the last reset.
  def self.due?
    last_reset = User.minimum(:created_at)
    last_reset.nil? || last_reset < RESET_EVERY.ago
  end

  # Wipes everything and reloads db/seeds.rb, so the public demo returns to
  # only the seeded users and conversations. A full reset rather than
  # "delete what isn't seeded": visitors can log in as the demo users, edit
  # their profiles and delete the seeded conversations.
  def perform
    ActiveRecord::Base.transaction do
      # destroy (not delete_all) so messages' rich text and avatars go too.
      Conversation.destroy_all
      Profile.destroy_all
      User.delete_all

      Rails.application.load_seed
    end
  end
end
