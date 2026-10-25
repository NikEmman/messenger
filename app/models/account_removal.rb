# Deletes accounts with everything they posted. Conversations they shared
# with other users stay, minus their messages and memberships; the ones left
# with no members are deleted. Used by account deletion, ResetDemoDataJob and
# DeleteInactiveAccountsJob.
module AccountRemoval
  def self.remove(users)
    users = Array(users)

    ActiveRecord::Base.transaction do
      conversation_ids = ConversationUser.where(user: users).pluck(:conversation_id) |
        Message.where(user: users).distinct.pluck(:conversation_id)
      users.each(&:destroy!)
      Conversation.where(id: conversation_ids).where.missing(:conversation_users).destroy_all
      survivors = Conversation.where(id: conversation_ids).to_a
      survivors.each(&:refresh_last_message_at)

      # Waits for the outermost transaction, e.g. the demo reset's.
      ActiveRecord.after_all_transactions_commit do
        broadcast_removal(survivors, users.map(&:id))
        users.each { |user| ActionCable.server.remote_connections.where(current_user: user).disconnect }
      end
    end
  end

  # Members of the conversations that outlived the accounts see their
  # messages and memberships disappear live.
  def self.broadcast_removal(conversations, user_ids)
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
