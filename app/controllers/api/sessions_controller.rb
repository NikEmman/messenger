module Api
  class SessionsController < ApplicationController
    include CurrentUserConcern
    # Since the app is hosted on a servcie that sleeps after a period of inactivity,
    # we will enqueue a job to clean up old messages (older than one week) after
    # a successful login, but only if there are any messages older than one week.
    # This ensures that the cleanup job is only enqueued when necessary and helps
    # keep the database tidy without requiring a separate scheduled task.
    # The actual deletion of old messages is handled by the CleanupOldMessagesJob.
    after_action :maybe_enqueue_cleanup, only: [ :create ]

    def create
      user = User.find_by(email: session_params[:email])&.authenticate(session_params[:password])

      if user
        session[:user_id] = user.id
        render json: {
          status: :created,
          logged_in: true,
          user: user
        }, status: :created
      else
        render json: {
          status: 401,
          logged_in: false
        }, status: :unauthorized
      end
    end

    def logged_in
        if @current_user
          render json: {
            logged_in: true,
            user: @current_user
          }
        else
          render json: { logged_in: false }
        end
    end

    def logout
        reset_session
        render json: { status: 200, logged_out: true }
    end

    def other_users
        users = User.where.not(id: @current_user&.id)
        render json: { status: :ok, users: users }
    end

    private

    def session_params
        params.require(:user).permit(:email, :password)
    end
    def maybe_enqueue_cleanup
      return unless Message.where("created_at < ?", 1.week.ago).where.not(id: 1..14).exists?


      if Rails.env.production?
        CleanupOldMessagesJob.perform_later
      end
    end
  end
end
