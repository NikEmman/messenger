module Api
  class ProfilesController < BaseController
    def create
      profile = Profile.new(profile_params.merge(user: @current_user))
      profile.save!
      render json: { profile: profile_json(profile) }, status: :created
    end

    def update
      profile = Profile.where(user: @current_user).find(params[:id])
      profile.update!(profile_params)
      render json: { profile: profile_json(profile) }
    end

    # GET /api/profiles/:user_id
    def show
      profile = Profile.includes(:user).find_by!(user_id: params[:id])
      render json: profile_json(profile)
    end

    private

    def profile_params
      params.require(:profile).permit(:address, :birthday, :avatar)
    end

    def profile_json(profile)
      {
        id: profile.id,
        user_id: profile.user_id,
        name: profile.user.name,
        address: profile.address,
        birthday: profile.birthday,
        avatar_url: avatar_url(profile)
      }
    end
  end
end
