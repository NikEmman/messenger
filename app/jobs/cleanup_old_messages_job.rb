class CleanupOldMessagesJob < ApplicationJob
  queue_as :default

  # Deletes visitor messages older than a week, keeping the seeded demo
  # conversation intact. Intended for the production demo.
  def perform
    expired = Message.expired
    conversation_ids = expired.distinct.pluck(:conversation_id)
    return if conversation_ids.empty?

    # destroy (not delete_all) so each message's rich-text body goes too.
    expired.includes(:rich_text_body).find_each(&:destroy)
    Conversation.where(id: conversation_ids).find_each(&:refresh_last_message_at)
  end
end
