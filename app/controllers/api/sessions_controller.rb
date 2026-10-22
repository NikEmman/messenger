module Api
  class SessionsController < BaseController
    skip_before_action :require_login, only: [ :create, :logged_in, :logout ]
    # The public demo is reset at most once a day, on the first login after it
    # is due, rather than on a schedule: hosts like Render sleep when idle.
    # It runs before authenticating so this login already sees the fresh data.
    before_action :reset_demo_data_if_due, only: [ :create ]

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

    def reset_demo_data_if_due
      return unless Rails.configuration.x.reset_demo_data && ResetDemoDataJob.due?

      ResetDemoDataJob.perform_now
    rescue ActiveRecord::ActiveRecordError => e
      # A simultaneous login reset it first; that reset stands.
      Rails.logger.warn("Demo data reset skipped: #{e.message}")
    end
  end
end
