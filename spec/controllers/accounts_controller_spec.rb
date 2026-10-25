require 'rails_helper'

RSpec.describe 'Api::Accounts', type: :request do
  describe 'DELETE /api/account' do
    let!(:user) { create(:user) }

    it 'requires login' do
      delete '/api/account', params: { password: 'password123' }

      expect(response).to have_http_status(:unauthorized)
    end

    context 'when logged in' do
      before { login_user(user) }

      it 'deletes the account with its messages and logs out' do
        create(:message, user: user)

        delete '/api/account', params: { password: 'password123' }

        expect(response).to have_http_status(:no_content)
        expect(User.exists?(user.id)).to be false
        expect(Message.where(user_id: user.id)).to be_empty
        expect(session[:user_id]).to be_nil
      end

      it 'rejects a wrong password' do
        delete '/api/account', params: { password: 'wrong' }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to eq('Wrong password')
        expect(User.exists?(user.id)).to be true
      end
    end

    it 'refuses to delete a demo account' do
      DemoData.seed!
      batman = DemoData.users.find_by!(email: 'bruce.wayne@wayneenterprises.com')
      post '/api/sessions', params: { user: { email: batman.email, password: 'gotham123' } }

      delete '/api/account', params: { password: 'gotham123' }

      expect(response).to have_http_status(:forbidden)
      expect(User.exists?(batman.id)).to be true
    end
  end
end
