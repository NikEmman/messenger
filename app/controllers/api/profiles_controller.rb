module Api
  class ProfilesController < ApplicationController
    def create
      @profile = Profile.new(profile_params)
      if @profile.save
        render json: { profile: @profile }, status: :created
      else
        render json: { errors: @profile.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      profile = Profile.find(params[:id])
      if profile.update(profile_params)
        render json: {
          status: :updated,
          profile: profile_response(profile)
        }
      else
        render json: {
          status: :unprocessable_entity,
          errors: profile.errors.full_messages
        }, status: :unprocessable_entity
      end
    end

    def show
      profile = Profile.includes(:user).find_by(user_id: params[:id])
      if profile
        render json: profile_response(profile)
      else
        render json: { status: :not_found }, status: :not_found
      end
    end

    private

    def profile_params
      params.require(:profile).permit(:user_id, :address, :birthday, :avatar)
    end

    def profile_response(profile)
      {
        id: profile.id,
        user_id: profile.user_id,
        name: profile.user.name,
        address: profile.address,
        birthday: profile.birthday,
        avatar_url: avatar_url(profile)
      }
    end

    def default_avatar_url
      request.base_url + ActionController::Base.helpers.asset_path("default_avatar.jpg")
    end

    def avatar_url(profile)
      profile&.avatar&.attached? ? url_for(profile.avatar) : default_avatar_url
    end
  end
end
