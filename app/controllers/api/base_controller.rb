module Api
  # Shared behaviour for every JSON endpoint: authentication, consistent error
  # responses, and serializers that never leak private user fields.
  class BaseController < ApplicationController
    include CurrentUserConcern

    before_action :require_login
    # The session (and with it the CSRF token) changes on login and logout, so
    # hand the client a fresh token on every response.
    after_action :set_csrf_token_header

    rescue_from ActiveRecord::RecordNotFound do
      render json: { error: "Not found" }, status: :not_found
    end

    rescue_from ActiveRecord::RecordInvalid do |error|
      render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
    end

    rescue_from ActionController::ParameterMissing do |error|
      render json: { error: error.message }, status: :bad_request
    end

    rescue_from ActionController::InvalidAuthenticityToken do
      render json: { error: "Invalid CSRF token" }, status: :unprocessable_entity
    end

    private

    def require_login
      render json: { error: "You must be logged in" }, status: :unauthorized unless @current_user
    end

    def log_in(user)
      reset_session # prevent session fixation
      session[:user_id] = user.id
    end

    def set_csrf_token_header
      response.set_header("X-CSRF-Token", form_authenticity_token)
    end

    def user_json(user)
      { id: user.id, name: user.name, email: user.email, avatar_url: avatar_url(user.profile) }
    end

    def member_json(conversation_user)
      user_json(conversation_user.user).merge(
        membership_id: conversation_user.id,
        online: conversation_user.user.online?
      )
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

    # Push a live event to members' inbox streams (see InboxChannel).
    def broadcast_to_users(users, payload)
      users.each { |user| InboxChannel.broadcast_to(user, payload) }
    end

    def message_json(message)
      {
        id: message.id,
        user_id: message.user_id,
        conversation_id: message.conversation_id,
        body: message.body.body.to_html,
        created_at: message.created_at
      }
    end

    def avatar_url(profile)
      if profile&.avatar&.attached?
        url_for(profile.avatar)
      else
        request.base_url + ActionController::Base.helpers.asset_path("default_avatar.jpg")
      end
    end
  end
end
