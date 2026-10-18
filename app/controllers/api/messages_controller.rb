module Api
  class MessagesController < BaseController
    PAGE_SIZE = 30

    before_action :set_conversation

    # GET /api/conversations/:conversation_id/messages?before=<message id>
    # Returns the newest page (oldest first) and whether older messages exist.
    def index
      scope = @conversation.messages.with_rich_text_body.order(id: :desc)
      scope = scope.where("messages.id < ?", params[:before]) if params[:before].present?
      page = scope.limit(PAGE_SIZE + 1).to_a

      render json: {
        messages: page.first(PAGE_SIZE).reverse.map { |message| message_json(message) },
        has_more: page.size > PAGE_SIZE
      }
    end

    def create
      message = @conversation.messages.create!(user: @current_user, body: params.require(:message).require(:body))

      render json: { message: message_json(message) }, status: :created
    end

    private

    def set_conversation
      @conversation = @current_user.conversations.find(params[:conversation_id])
    end
  end
end
