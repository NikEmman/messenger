module Api
  class ConversationUsersController < ApplicationController
    include CurrentUserConcern

    def create
      conversation_user = ConversationUser.create!(conversation_id: params["conversation_id"], user_id: params["user_id"])
      if conversation_user
        render json: {
          status: "created"
        }, status: :created
      else
        render json: { status: :unprocessable_entity }
      end
    end

    def destroy
      conversation_user = ConversationUser.find_by(id: params[:id])

      if conversation_user.nil?
        return render json: { error: "Membership not found" }, status: :not_found
      end

      conversation = conversation_user.conversation

      # Authorization: current user must be in the conversation
      unless conversation.users.exists?(@current_user.id)
        return render json: { error: "You must be a member of this conversation to remove members" }, status: :forbidden
      end

      # Remove the user from the conversation
      conversation_user.destroy

      # Check if conversation has any remaining users
      if conversation.users.empty?
        conversation.destroy
        return render json: {
          message: "User removed and conversation deleted (was empty)",
          conversation_deleted: true
        }, status: :ok
      end

      render json: {
        message: "User removed from conversation",
        conversation_deleted: false
      }, status: :ok
    end
  end
end
