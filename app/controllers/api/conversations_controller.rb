module Api
  class ConversationsController < ApplicationController
      include CurrentUserConcern
      def index
        if @current_user
          conversations = @current_user.conversations.map do |conversation|
            {
              id: conversation.id,
              topic: conversation.topic,
              messages: conversation.messages.map { |message| { body: message.body.body, user_id: message.user_id } },
              members: conversation.users.map do |user|
                { id: user.id, email: user.email, name: user.name, avatar_url: avatar_url(user.profile) } end
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
        conversation = Conversation.find_by(id: params[:id])

        if conversation
          content = conversation.messages.map { |message| message.body.body }
          render json: {
            id: conversation.id,
            messages: content,
            members: conversation.users.map { |user| { id: user.id, email: user.email, name: user.name } }
          }
        else
          render json: { error: "Conversation not found" }, status: :not_found
        end
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
        request.base_url + ActionController::Base.helpers.asset_path("default_avatar.jpg")
      end
      def avatar_url(profile)
        profile&.avatar&.attached? ? url_for(profile.avatar) : default_avatar_url
      end
  end
end
