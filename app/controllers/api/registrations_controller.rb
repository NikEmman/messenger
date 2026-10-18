module Api
  class RegistrationsController < BaseController
    skip_before_action :require_login

    def create
      user = User.create!(user_params)
      log_in(user)
      render json: { user: user_json(user) }, status: :created
    end

    private

    def user_params
      params.require(:user).permit(:email, :password, :password_confirmation, :name)
    end
  end
end
