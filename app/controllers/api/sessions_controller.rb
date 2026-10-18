module Api
  class SessionsController < BaseController
    skip_before_action :require_login, only: [ :create, :logged_in, :logout ]
    # Since the app is hosted on a service that sleeps after a period of inactivity,
    # we will enqueue a job to clean up old messages (older than one week) after
    # a successful login, but only if there are any messages older than one week.
    # This ensures that the cleanup job is only enqueued when necessary and helps
    # keep the database tidy without requiring a separate scheduled task.
    # The actual deletion of old messages is handled by the CleanupOldMessagesJob.
    after_action :maybe_enqueue_cleanup, only: [ :create ]

    def create
      user = User.find_by(email: session_params[:email])&.authenticate(session_params[:password])

      if user
        log_in(user)
        render json: { user: user_json(user) }, status: :created
      else
        render json: { error: "Wrong email or password" }, status: :unauthorized
      end
    end

    def logged_in
      if @current_user
        render json: { logged_in: true, user: user_json(@current_user) }
      else
        render json: { logged_in: false }
      end
    end

    def logout
      reset_session
      head :no_content
    end

    private

    def session_params
      params.require(:user).permit(:email, :password)
    end

    def maybe_enqueue_cleanup
      return unless response.successful?
      return unless Message.expired.exists?

      if Rails.env.production?
        CleanupOldMessagesJob.perform_later
      end
    end
  end
end
