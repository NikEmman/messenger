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
      it 'creates a new user and logs them in' do
        expect {
          post '/api/registrations', params: { user: valid_attributes }
        }.to change(User, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(session[:user_id]).to eq(User.last.id)
      end

      it 'never exposes the password digest' do
        post '/api/registrations', params: { user: valid_attributes }

        expect(json_response['user']).not_to have_key('password_digest')
      end
    end

    context 'with invalid parameters' do
      it 'does not create a user and returns the errors' do
        expect {
          post '/api/registrations', params: { user: invalid_attributes }
        }.not_to change(User, :count)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to include("Password confirmation doesn't match Password")
      end
    end
  end
end
