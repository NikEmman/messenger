require 'rails_helper'

RSpec.describe 'Api::Sessions', type: :request do
  let!(:user) { create(:user) }
  let(:valid_params) { { user: { email: user.email, password: user.password } } }
  let(:invalid_params) { { user: { email: user.email, password: 'wrong' } } }

  describe 'POST /api/sessions' do
    it 'logs in with valid credentials' do
      post '/api/sessions', params: valid_params

      expect(response).to have_http_status(:created)
      expect(json_response['logged_in']).to be true
      expect(json_response['user']['email']).to eq(user.email)
    end

    it 'rejects invalid credentials' do
      post '/api/sessions', params: invalid_params

      expect(response).to have_http_status(401)
      expect(json_response['logged_in']).to be false
    end
  end

  describe 'GET /api/logged_in' do
    context 'when user is logged in' do
      before do
        post '/api/sessions', params: valid_params
      end

      it 'returns logged in status and user info' do
        get '/api/logged_in'

        expect(response).to have_http_status(:ok)
        expect(json_response['logged_in']).to be true
        expect(json_response['user']['email']).to eq(user.email)
      end
    end

    context 'when user is not logged in' do
      it 'returns logged out status' do
        get '/api/logged_in'

        expect(response).to have_http_status(:ok)
        expect(json_response['logged_in']).to be false
      end
    end
  end

  describe 'DELETE /api/logout' do
    before do
      post '/api/sessions', params: valid_params
    end

    it 'logs out the user' do
      delete '/api/logout'

      expect(response).to have_http_status(:ok)
      expect(json_response['logged_out']).to be true

      get '/api/logged_in'
      expect(json_response['logged_in']).to be false
    end
  end

  describe 'GET /api/other_users' do
    let!(:other_user) { create(:user) }

    before do
      post '/api/sessions', params: valid_params
    end

    it 'returns list of other users' do
      get '/api/other_users'

      expect(response).to have_http_status(:ok)
      expect(json_response['users'].length).to eq(1)
      expect(json_response['users'].first['id']).to eq(other_user.id)
    end
  end

  private

  def json_response
    JSON.parse(response.body)
  end
end
