module Api
  class RegistrationsController < ApplicationController
    def create
      user = User.create(user_params)
      if user.persisted?
        session[:user_id] = user.id
        render json: { status: :created, user: user }, status: :created
      else
        render json: { status: :unprocessable_entity, errors: user.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def user_params
      params.require(:user).permit(:email, :password, :password_confirmation, :name)
    end
  end
end
