module Api
  class ConversationsController < BaseController
    # Sidebar summaries: members, last message preview and unread count — but
    # no message history, which is paginated via MessagesController.
    def index
      conversations = @current_user.conversations
        .by_recent_activity
        .includes(conversation_users: { user: { profile: { avatar_attachment: :blob } } })
        .to_a
      last_messages = Message.latest_per_conversation(conversations.map(&:id)).index_by(&:conversation_id)
      unread_counts = Message.unread_counts_for(@current_user)

      render json: {
        conversations: conversations.map do |conversation|
          conversation_json(conversation,
                            last_message: last_messages[conversation.id],
                            unread_count: unread_counts.fetch(conversation.id, 0))
        end
      }
    end

    def create
      conversation = Conversation.transaction do
        Conversation.create!(conversation_params).tap do |c|
          c.conversation_users.create!(user: @current_user, last_read_at: Time.current)
        end
      end

      render json: { conversation: conversation_json(conversation) }, status: :created
    end

    def show
      conversation = find_conversation
      render json: conversation_json(conversation, last_message: conversation.messages.last)
    end

    def destroy
      conversation = find_conversation
      others = conversation.users.where.not(id: @current_user.id).to_a
      conversation.destroy!

      broadcast_to_users(others, type: "conversation_removed", conversation_id: conversation.id)
      head :no_content
    end

    # POST /api/conversations/:id/read
    def read
      find_conversation.conversation_users.find_by!(user: @current_user).update!(last_read_at: Time.current)
      head :no_content
    end

    private

    def find_conversation
      @current_user.conversations.find(params[:id])
    end

    def conversation_params
      params.require(:conversation).permit(:topic)
    end
  end
end
