module Api
  class ConversationUsersController < BaseController
    def create
      conversation = @current_user.conversations.find(params.require(:conversation_id))
      user = User.find(params.require(:user_id))
      membership = conversation.conversation_users.create!(user: user)

      render json: { member: member_json(membership) }, status: :created
    end

    # Removes a member (or the current user, when leaving). Only members of the
    # conversation may do this; the conversation is deleted once it is empty.
    def destroy
      membership = ConversationUser.where(conversation: @current_user.conversations).find(params[:id])
      conversation = membership.conversation
      membership.destroy!

      conversation_deleted = !conversation.conversation_users.exists?
      conversation.destroy! if conversation_deleted

      render json: { conversation_deleted: conversation_deleted, removed_user_id: membership.user_id }
    end
  end
end
