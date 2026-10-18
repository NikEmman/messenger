require 'rails_helper'

RSpec.describe 'Api::Messages', type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:conversation) { create(:conversation) }

  it 'requires login' do
    post '/api/messages', params: { message: { conversation_id: conversation.id, body: 'Hi' } }

    expect(response).to have_http_status(:unauthorized)
  end

  context 'when logged in' do
    before { login_user(user) }

    context 'as a member of the conversation' do
      before { create(:conversation_user, user: user, conversation: conversation) }

      it 'creates a message authored by the current user' do
        expect {
          post '/api/messages', params: { message: { conversation_id: conversation.id, body: 'Hi' } }
        }.to change(Message, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response['message']['user_id']).to eq(user.id)
        expect(json_response['message']['conversation_id']).to eq(conversation.id)
        expect(json_response['message']['body']).to include('Hi')
      end

      it 'ignores a spoofed user_id' do
        post '/api/messages', params: { message: { conversation_id: conversation.id, body: 'Hi', user_id: other_user.id } }

        expect(Message.last.user).to eq(user)
      end

      it 'rejects an empty body' do
        post '/api/messages', params: { message: { conversation_id: conversation.id, body: '' } }

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    it 'cannot post into a conversation the user is not a member of' do
      expect {
        post '/api/messages', params: { message: { conversation_id: conversation.id, body: 'Hi' } }
      }.not_to change(Message, :count)

      expect(response).to have_http_status(:not_found)
    end
  end
end
