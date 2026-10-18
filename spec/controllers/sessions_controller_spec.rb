require 'rails_helper'

RSpec.describe 'Api::Sessions', type: :request do
  let!(:user) { create(:user) }
  let(:valid_params) { { user: { email: user.email, password: user.password } } }
  let(:invalid_params) { { user: { email: user.email, password: 'wrong' } } }

  describe 'POST /api/sessions' do
    it 'logs in with valid credentials' do
      post '/api/sessions', params: valid_params

      expect(response).to have_http_status(:created)
      expect(json_response['user']['email']).to eq(user.email)
    end

    it 'never exposes the password digest' do
      post '/api/sessions', params: valid_params

      expect(json_response['user'].keys).to contain_exactly('id', 'name', 'email', 'avatar_url')
    end

    it 'rejects invalid credentials' do
      post '/api/sessions', params: invalid_params

      expect(response).to have_http_status(:unauthorized)
      expect(json_response['error']).to eq('Wrong email or password')
    end

    it 'returns a fresh CSRF token' do
      post '/api/sessions', params: valid_params

      expect(response.headers['X-CSRF-Token']).to be_present
    end
  end

  describe 'GET /api/logged_in' do
    it 'returns the user when logged in' do
      post '/api/sessions', params: valid_params
      get '/api/logged_in'

      expect(response).to have_http_status(:ok)
      expect(json_response['logged_in']).to be true
      expect(json_response['user']['email']).to eq(user.email)
    end

    it 'returns logged out status otherwise' do
      get '/api/logged_in'

      expect(response).to have_http_status(:ok)
      expect(json_response['logged_in']).to be false
    end
  end

  describe 'DELETE /api/logout' do
    it 'logs out the user' do
      post '/api/sessions', params: valid_params
      delete '/api/logout'

      expect(response).to have_http_status(:no_content)

      get '/api/logged_in'
      expect(json_response['logged_in']).to be false
    end
  end

  describe 'CSRF protection' do
    around do |example|
      ActionController::Base.allow_forgery_protection = true
      example.run
    ensure
      ActionController::Base.allow_forgery_protection = false
    end

    it 'rejects state-changing requests without a token' do
      post '/api/sessions', params: valid_params

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response['error']).to eq('Invalid CSRF token')
    end
  end
end
