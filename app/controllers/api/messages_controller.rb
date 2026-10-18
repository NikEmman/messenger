module Api
  class MessagesController < BaseController
    def create
      conversation = @current_user.conversations.find(message_params[:conversation_id])
      message = conversation.messages.create!(user: @current_user, body: message_params[:body])

      render json: { message: message_json(message) }, status: :created
    end

    private

    def message_params
      params.require(:message).permit(:conversation_id, :body)
    end
  end
end
