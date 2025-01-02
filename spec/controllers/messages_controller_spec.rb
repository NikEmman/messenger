require 'rails_helper'

RSpec.describe 'Api::Messages', type: :request do
  let(:user) { create(:user) }
  let(:conversation) { create(:conversation) }
  let(:message_attributes) { attributes_for(:message, user_id: user.id, conversation_id: conversation.id) }

  describe 'POST /api/messages' do
    context 'with valid attributes' do
      it 'creates a message' do
        expect {
          post '/api/messages', params: { message: message_attributes }
        }.to change(Message, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response['message']['user_id']).to eq(user.id)
        expect(json_response['message']['conversation_id']).to eq(conversation.id)
        expect(json_response['message']['body']).to eq(message_attributes[:body])
      end
    end

    context 'with invalid attributes' do
      it 'returns error messages' do
        post '/api/messages', params: { message: { user_id: nil, conversation_id: nil, body: nil } }

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  private

  def json_response
    JSON.parse(response.body)
  end
end
