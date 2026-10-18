# One stream per user carrying everything their UI needs to stay live:
# new messages, typing indicators, presence and membership changes.
class InboxChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
    appear
  end

  def unsubscribed
    current_user.update_column(:last_seen_at, nil)
    Presence.broadcast(current_user, online: false)
  end

  # Heartbeat from the client (every ~30s) keeps the user marked online.
  def appear
    was_online = current_user.online?
    current_user.update_column(:last_seen_at, Time.current)
    Presence.broadcast(current_user, online: true) unless was_online
  end

  def typing(data)
    conversation = current_user.conversations.find_by(id: data["conversation_id"])
    return unless conversation

    conversation.users.where.not(id: current_user.id).find_each do |user|
      InboxChannel.broadcast_to(user, type: "typing", conversation_id: conversation.id, user_id: current_user.id)
    end
  end
end
