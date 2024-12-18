module Api
  class MessagesController < ApplicationController
    def create
      message = Message.create!(message_params)
      if message
        render json: {
          status: :created,
          message: {
            id: message.id,
            user_id: message.user_id,
            conversation_id: message.conversation_id,
            body: message.body.body,
            created_at: message.created_at,
            updated_at: message.updated_at
          }
        }
      else
        render json: { status: :unprocessable_entity }
      end
    end
    private
    def message_params
      params.require(:message).permit(:user_id, :conversation_id, :body)
    end
  end
end
