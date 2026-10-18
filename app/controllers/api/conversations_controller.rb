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
      find_conversation.destroy!
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

    def conversation_json(conversation, last_message: nil, unread_count: 0)
      {
        id: conversation.id,
        topic: conversation.topic,
        members: conversation.conversation_users.map { |cu| member_json(cu) },
        last_message: last_message && {
          id: last_message.id,
          user_id: last_message.user_id,
          preview: last_message.preview,
          created_at: last_message.created_at
        },
        unread_count: unread_count
      }
    end
  end
end
