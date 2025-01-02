require 'rails_helper'

RSpec.describe 'Api::Registrations', type: :request do
  describe 'POST /api/registrations' do
    let(:valid_attributes) do
      { email: 'test@example.com', password: 'password', password_confirmation: 'password', name: 'Test User' }
    end

    let(:invalid_attributes) do
      { email: 'test@example.com', password: 'password', password_confirmation: 'mismatch', name: 'Test User' }
    end

    context 'with valid parameters' do
      it 'creates a new user' do
        expect {
          post '/api/registrations', params: { user: valid_attributes }
        }.to change(User, :count).by(1)
      end

      it 'responds with status :created' do
        post '/api/registrations', params: { user: valid_attributes }
        expect(response).to have_http_status(:created)
      end

      it 'sets the session user_id' do
        post '/api/registrations', params: { user: valid_attributes }
        expect(session[:user_id]).to eq(User.last.id)
      end
    end

    context 'with invalid parameters' do
      it 'does not create a new user' do
        expect {
          post '/api/registrations', params: { user: invalid_attributes }
        }.not_to change(User, :count)
      end

      it 'responds with status :unprocessable_entity' do
        post '/api/registrations', params: { user: invalid_attributes }
        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns error messages' do
        post '/api/registrations', params: { user: invalid_attributes }
        expect(JSON.parse(response.body)['errors']).to include("Password confirmation doesn't match Password")
      end
    end
  end
end
