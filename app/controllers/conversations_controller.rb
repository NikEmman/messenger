class ConversationsController < ApplicationController
  include CurrentUserConcern
  def index
    if @current_user
      conversations = @current_user.conversations.map do |conversation|
        {
          id: conversation.id,
          topic: conversation.topic,
          messages: conversation.messages.map { |message| message.body },
          members: conversation.users.map do |user|
            avatar_url = user.profile.avatar.attached? ? url_for(user.profile.avatar) : default_avatar_url
            { id: user.id, email: user.email, name: user.name, avatar_url: avatar_url } end
        }
      end
    else
      conversations = []
    end

    render json: {
      conversations: conversations
    }
  end

  def create
    conversation = Conversation.create!(conversation_params)
    if conversation
      ConversationUser.create!(user_id: @current_user.id, conversation_id: conversation.id)
      render json: {
        status: :created,
        conversation: {
            id: conversation.id,
            topic: conversation.topic, messages: [],
            members: conversation.users.map { |user| { id: user.id, email: user.email, name: user.name } }
          },
        message: "Conversation created successfully" }
    else
      render json: { status: :unprocessable_entity, errors: conversation.errors.full_messages }
    end
  end

  def show
    conversation = Conversation.find(params[:id])
    content = conversation.messages.map { |message| message.body }
    render json: {
      id: conversation.id,
      messages: content,
      members: conversation.users.map { |user| { id: user.id, email: user.email, name: user.name } }
    }
  end
  def destroy
    conversation = Conversation.find(params[:id])
    conversation.destroy
    render json: { status: 200 }
  end

  private
  def conversation_params
    params.require(:conversation).permit(:topic)
  end
  def default_avatar_url
    "http://localhost:3000" + ActionController::Base.helpers.asset_path("default_avatar.jpg")
  end
end
