require 'rails_helper'

RSpec.describe Api::ProfilesController, type: :request do
  let(:user) { create(:user) }
  let(:profile_attributes) { attributes_for(:profile, user_id: user.id) }

  describe 'POST /api/profiles' do
    context 'with valid attributes' do
      it 'creates a profile' do
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

        post '/api/profiles', params: {
          profile: profile_attributes.merge(avatar: file)
        }

        expect(response).to have_http_status(:created)
        expect(json_response['profile']['avatar_url']).to be_present
      end
    end

    context 'with invalid attributes' do
      it 'returns error messages' do
        post '/api/profiles', params: { profile: { user_id: nil } }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to be_present
      end
    end
  end

  describe 'PUT /api/profiles/:id' do
    let!(:profile) { create(:profile, user: user) }
    let(:new_address) { '123 New Street' }

    context 'with valid attributes' do
      it 'updates the profile' do
        put "/api/profiles/#{profile.id}", params: {
          profile: { address: new_address }
        }

        expect(response).to have_http_status(:ok)
        expect(json_response['profile']['address']).to eq(new_address)
      end

      it 'updates avatar' do
        file = fixture_file_upload('spec/fixtures/files/test_avatar.jpg', 'image/jpeg')

        put "/api/profiles/#{profile.id}", params: {
          profile: { avatar: file }
        }

        expect(response).to have_http_status(:ok)
        expect(json_response['profile']['avatar_url']).not_to eq(default_avatar_url)
      end
    end

    context 'with invalid attributes' do
      it 'returns error messages' do
        put "/api/profiles/#{profile.id}", params: {
          profile: { user_id: nil }
        }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to be_present
      end
    end
  end

  describe 'GET /api/profiles/:id' do
    context 'when profile exists' do
      let!(:profile) { create(:profile, user: user) }

      it 'returns the profile' do
        get "/api/profiles/#{user.id}"

        expect(response).to have_http_status(:ok)
        expect(json_response['id']).to eq(profile.id)
        expect(json_response['user_id']).to eq(user.id)
        expect(json_response['name']).to eq(user.name)
      end
    end

    context 'when profile does not exist' do
      it 'returns not found status' do
        get "/api/profiles/0"

        expect(response).to have_http_status(:not_found)
      end
    end
  end



  private

  def json_response
    JSON.parse(response.body)
  end

  def default_avatar_url
    "http://localhost:3000" + ActionController::Base.helpers.asset_path("default_avatar.jpg")
  end
end
