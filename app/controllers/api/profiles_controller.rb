module Api
  class ProfilesController < ApplicationController
    def create
      profile = Profile.create(profile_params)
      if profile.persisted?
          render json: {
          status: :created,
          profile: {
            id: profile.id,
            user_id: profile.user_id,
            address: profile.address,
            birthday: profile.birthday,
            avatar_url: avatar_url(profile)
          }
        }, status: :created
      else
        render json: {
          status: :unprocessable_entity,
          errors: profile.errors.full_messages
        }, status: :unprocessable_entity
      end
    end

    def update
      profile = Profile.find(params[:id])
      if profile.update(profile_params)
          render json: {
          status: :updated,
          profile: {
            id: profile.id,
            user_id: profile.user_id,
            address: profile.address,
            birthday: profile.birthday,
            avatar_url: avatar_url(profile)
          }
        }
      else
        render json: {
          status: :unprocessable_entity,
          errors: profile.errors.full_messages
        }, status: :unprocessable_entity
      end
    end

    def show
      profile = User.find(params[:id]).profile
      if profile
        render json: {
            id: profile.id,
            name: profile.user.name,
            birthday: profile.birthday,
            address: profile.address,
            user_id: profile.user_id,
            avatar_url: avatar_url(profile)
        }
      else
        render json: { status: :not_found }
      end
    end
    private
    def profile_params
      params.require(:profile).permit(:birthday, :address, :avatar, :user_id)
    end
    def default_avatar_url
      "http://localhost:3000" + ActionController::Base.helpers.asset_path("default_avatar.jpg")
    end
    def avatar_url(profile)
      profile&.avatar&.attached? ? url_for(profile.avatar) : default_avatar_url
    end
  end
end
