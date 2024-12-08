class ConversationsController < ApplicationController
  def index
    if @current_user
      conversations = @current_user.conversations
    end
    members = conversation.users
    render json: {
      conversations: conversations,
      members: members

    }
  end
  def show
    conversation = Conversation.find(params[:id])
    content = conversation.messages.map { |message| message.body }
    render json: {
      id: conversation.id,
      messages: content,
      members: conversation.users
    }
  end
  def destroy
    conversation = Conversation.find(params[:id])
    conversation.destroy
    render json: { status: 200 }
  end
end
