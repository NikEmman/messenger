class MessagesController < ApplicationController
  def create
    message = Message.create!(user_id: params["user_id"], conversation_id: params["conversation_id"], body: params[:body])
    if message
      render json: {
        status: :created,
        message: {
          id: message.id,
          user_id: message.user_id,
          conversation_id: message.conversation_id,
          body: message.body,
          created_at: message.created_at,
          updated_at: message.updated_at
        }
      }
    else
      render json: { status: :unprocessable_entity }
    end
  end
end
