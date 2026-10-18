module Api
  class ConversationUsersController < BaseController
    def create
      conversation = @current_user.conversations.find(params.require(:conversation_id))
      user = User.find(params.require(:user_id))
      membership = conversation.conversation_users.create!(user: user)
      member = member_json(membership)

      broadcast_to_users(conversation.users.where.not(id: [ user.id, @current_user.id ]),
                         type: "member_added", conversation_id: conversation.id, member: member)
      InboxChannel.broadcast_to(user, type: "conversation_added", conversation: conversation_json(
        conversation.reload,
        last_message: conversation.messages.last,
        unread_count: conversation.messages.count
      ))

      render json: { member: member }, status: :created
    end

    # Removes a member (or the current user, when leaving). Only members of the
    # conversation may do this; the conversation is deleted once it is empty.
    def destroy
      membership = ConversationUser.where(conversation: @current_user.conversations).find(params[:id])
      conversation = membership.conversation
      membership.destroy!

      conversation_deleted = !conversation.conversation_users.exists?
      conversation.destroy! if conversation_deleted

      InboxChannel.broadcast_to(membership.user, type: "conversation_removed", conversation_id: conversation.id)
      unless conversation_deleted
        broadcast_to_users(conversation.users.where.not(id: @current_user.id),
                           type: "member_removed", conversation_id: conversation.id, user_id: membership.user_id)
      end

      render json: { conversation_deleted: conversation_deleted, removed_user_id: membership.user_id }
    end
  end
end
