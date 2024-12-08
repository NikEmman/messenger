class MessagesController < ApplicationController
  def create
    message = Message.create!(user_id: params["user_id"], conversation_id: params["conversation_id"], body: params[:body])
    if message
      render json: {
        status: :created
      }
    else render json: { status: :unprocessable_entity }
    end
  end
end
