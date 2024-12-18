module Api
  class ConversationUsersController < ApplicationController
    def create
      conversation_user = ConversationUser.create!(conversation_id: params["conversation_id"], user_id: params["user_id"])
      if conversation_user
        render json: {
          status: :created
        }
      else
        render json: { status: :unprocessable_entity }
      end
    end
  end
end
