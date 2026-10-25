class ResetDemoDataJob < ApplicationJob
  queue_as :default

  IDLE_FOR = 30.minutes

  # Compared with true because an unset config.x key is an empty (truthy)
  # OrderedOptions rather than nil.
  def self.enabled?
    Rails.configuration.x.reset_demo_data == true
  end

  # Queued whenever a demo account's last connection closes. If someone is
  # back on a demo account when it runs it does nothing; their own
  # disconnect queues the next one.
  def self.schedule
    set(wait: IDLE_FOR).perform_later if enabled?
  end

  # Due once a demo account has been used since the last reset and none has
  # been seen for IDLE_FOR, or when an account is missing altogether.
  def self.due?
    users = DemoData.users.to_a
    return true if users.size < DemoData::EMAILS.size

    users.all? { |user| user.last_seen_at.nil? || user.last_seen_at < IDLE_FOR.ago } &&
      users.any? { |user| user.last_seen_at && user.last_seen_at > user.created_at }
  end

  # Deletes the demo accounts with everything they posted, then seeds them
  # afresh. Conversations they shared with other users stay, minus the demo
  # accounts' messages; the ones left with no members are deleted.
  def perform
    users = survivors = nil

    ActiveRecord::Base.transaction do
      users = DemoData.users.lock.to_a
      # Recheck under the lock: a simultaneous reset may have just run.
      next unless self.class.due?

      conversation_ids = ConversationUser.where(user: users).pluck(:conversation_id) |
        Message.where(user: users).distinct.pluck(:conversation_id)
      # destroy (not delete_all) so rich text, embedded images and avatars go too.
      Message.where(user: users).find_each(&:destroy!)
      users.each(&:destroy!)
      Conversation.where(id: conversation_ids).where.missing(:conversation_users).destroy_all
      survivors = Conversation.where(id: conversation_ids).to_a
      survivors.each(&:refresh_last_message_at)

      DemoData.seed!
    end

    broadcast_removal(survivors, users.map(&:id)) if survivors
  end

  private

  # Members of the conversations that outlived the demo accounts see their
  # messages and memberships disappear live.
  def broadcast_removal(conversations, user_ids)
    conversations.each do |conversation|
      last_message = conversation.messages.order(:id).last

      conversation.users.find_each do |member|
        InboxChannel.broadcast_to(member,
          type: "users_removed",
          conversation_id: conversation.id,
          user_ids: user_ids,
          last_message: last_message && {
            id: last_message.id,
            user_id: last_message.user_id,
            preview: last_message.preview,
            created_at: last_message.created_at
          },
          unread_count: Message.unread_counts_for(member).fetch(conversation.id, 0))
      end
    end
  end
end
