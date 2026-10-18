module Api
  class ConversationsController < BaseController
    def index
      conversations = @current_user.conversations
        .includes(
          messages: :rich_text_body,
          conversation_users: { user: { profile: { avatar_attachment: :blob } } }
        )
        .sort_by { |c| c.messages.map(&:created_at).max || c.created_at }
        .reverse

      render json: { conversations: conversations.map { |c| conversation_json(c) } }
    end

    def create
      conversation = Conversation.transaction do
        Conversation.create!(conversation_params).tap do |c|
          c.conversation_users.create!(user: @current_user)
        end
      end

      render json: { conversation: conversation_json(conversation) }, status: :created
    end

    def show
      render json: conversation_json(find_conversation)
    end

    def destroy
      find_conversation.destroy!
      head :no_content
    end

    private

    def find_conversation
      @current_user.conversations.find(params[:id])
    end

    def conversation_params
      params.require(:conversation).permit(:topic)
    end

    def conversation_json(conversation)
      {
        id: conversation.id,
        topic: conversation.topic,
        messages: conversation.messages.sort_by(&:created_at).map { |m| message_json(m) },
        members: conversation.conversation_users.map { |cu| member_json(cu) }
      }
    end
  end
end
