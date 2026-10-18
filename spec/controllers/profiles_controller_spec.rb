require 'rails_helper'

RSpec.describe Api::ProfilesController, type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:profile_attributes) { attributes_for(:profile) }

  it 'requires login' do
    get "/api/profiles/#{user.id}"

    expect(response).to have_http_status(:unauthorized)
  end

  context 'when logged in' do
    before { login_user(user) }

    describe 'POST /api/profiles' do
      it "creates the current user's profile" do
        expect {
          post '/api/profiles', params: { profile: profile_attributes }
        }.to change(Profile, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response['profile']['user_id']).to eq(user.id)
        expect(json_response['profile']['address']).to eq(profile_attributes[:address])
        expect(json_response['profile']['birthday']).to eq(profile_attributes[:birthday].as_json)
      end

      it 'creates a profile with avatar' do
        file = fixture_file_upload('spec/fixtures/files/test_avatar.jpg', 'image/jpeg')

        post '/api/profiles', params: { profile: profile_attributes.merge(avatar: file) }

        expect(response).to have_http_status(:created)
        expect(json_response['profile']['avatar_url']).not_to eq(default_avatar_url)
      end

      it 'ignores a spoofed user_id' do
        post '/api/profiles', params: { profile: profile_attributes.merge(user_id: other_user.id) }

        expect(Profile.last.user).to eq(user)
      end

      it 'rejects a second profile' do
        create(:profile, user: user)

        post '/api/profiles', params: { profile: profile_attributes }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to be_present
      end
    end

    describe 'PUT /api/profiles/:id' do
      let!(:profile) { create(:profile, user: user) }

      it 'updates the profile' do
        put "/api/profiles/#{profile.id}", params: { profile: { address: '123 New Street' } }

        expect(response).to have_http_status(:ok)
        expect(json_response['profile']['address']).to eq('123 New Street')
      end

      it 'updates avatar' do
        file = fixture_file_upload('spec/fixtures/files/test_avatar.jpg', 'image/jpeg')

        put "/api/profiles/#{profile.id}", params: { profile: { avatar: file } }

        expect(response).to have_http_status(:ok)
        expect(json_response['profile']['avatar_url']).not_to eq(default_avatar_url)
      end

      it "cannot update someone else's profile" do
        others_profile = create(:profile, user: other_user)

        put "/api/profiles/#{others_profile.id}", params: { profile: { address: 'Hacked' } }

        expect(response).to have_http_status(:not_found)
        expect(others_profile.reload.address).not_to eq('Hacked')
      end
    end

    describe 'GET /api/profiles/:user_id' do
      it 'returns the profile' do
        profile = create(:profile, user: other_user)

        get "/api/profiles/#{other_user.id}"

        expect(response).to have_http_status(:ok)
        expect(json_response['id']).to eq(profile.id)
        expect(json_response['name']).to eq(other_user.name)
      end

      it 'returns not found when the user has no profile' do
        get '/api/profiles/0'

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  private

  def default_avatar_url
    "http://www.example.com" + ActionController::Base.helpers.asset_path("default_avatar.jpg")
  end
end
