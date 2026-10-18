# Tells everyone who shares a conversation with `user` that they came online or left.
module Presence
  def self.broadcast(user, online:)
    contacts_of(user).find_each do |contact|
      InboxChannel.broadcast_to(contact, type: "presence", user_id: user.id, online: online)
    end
  end

  def self.contacts_of(user)
    User.where(id: ConversationUser.where(conversation_id: user.conversation_users.select(:conversation_id)).select(:user_id))
      .where.not(id: user.id)
  end
end
