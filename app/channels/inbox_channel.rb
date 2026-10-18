# One stream per user carrying everything their UI needs to stay live:
# new messages, typing indicators, presence and membership changes.
class InboxChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
    Presence.broadcast(current_user, online: true) if current_user.connect_cable!
  end

  # Only announce "offline" once the user's last tab/window disconnects.
  def unsubscribed
    Presence.broadcast(current_user, online: false) if current_user.disconnect_cable!
  end

  # Heartbeat from the client (every ~30s) keeps the user marked online.
  def appear
    Presence.broadcast(current_user, online: true) if current_user.touch_presence!
  end

  def typing(data)
    conversation = current_user.conversations.find_by(id: data["conversation_id"])
    return unless conversation

    conversation.users.where.not(id: current_user.id).find_each do |user|
      InboxChannel.broadcast_to(user, type: "typing", conversation_id: conversation.id, user_id: current_user.id)
    end
  end
end
