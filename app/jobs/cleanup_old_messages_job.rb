class CleanupOldMessagesJob < ApplicationJob
  queue_as :default

  # This job deletes messages older than one week, excluding messages with IDs 1 to 14 (seeded, demo messages).
  # It is intended to be run in a production environment to clean up old messages.

  def perform
    old_messages = Message.where("created_at < ?", 1.week.ago).where.not(id: 1..14)
    return if old_messages.empty?

    old_messages.delete_all
  end
end
