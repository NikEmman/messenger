class ProfilesController < ApplicationController
  def create
    profile = Profile.create!(profile_params)
    avatar_url = profile.avatar.attached? ? url_for(profile.avatar) : default_avatar_url
    if profile
      render json: {
        status: :created,
        profile: {
          id: profile.id,
          user_id: profile.user_id,
          address: profile.address,
          birthday: profile.birthday,
          avatar_url: avatar_url
        }
      }
    else
      render json: { status: :unprocessable_entity }
    end
  end

  def update
    profile = Profile.find(params[:id])
    if profile.update(profile_params)
      avatar_url = profile.avatar.attached? ? url_for(profile.avatar) : default_avatar_url
      render json: {
        status: :updated,
        profile: {
          id: profile.id,
          user_id: profile.user_id,
          address: profile.address,
          birthday: profile.birthday,
          avatar_url: avatar_url
        }
      }
    else
      render json: { status: :unprocessable_entity }
    end
  end
  def show
    profile = Profile.find(params[:id])
    render json: {
      status: :created,
      profile: {
        id: profile.id,
        birthday: profile.birthday,
        address: profile.address,
        user_id: profile.user_id,
        avatar: profile.avatar
      }
    }
  end
  private
  def profile_params
    params.require(:profile).permit(:birthday, :address, :avatar, :user_id)
  end
  def default_avatar_url
    ActionController::Base.helpers.asset_path("default_avatar.jpg")
  end
end
