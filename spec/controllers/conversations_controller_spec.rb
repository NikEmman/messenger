require 'rails_helper'

RSpec.describe Api::ConversationsController, type: :request do
  let(:user) { create(:user) }
  let(:conversation) { create(:conversation) }

  before do
   login_user(user)
  end

  describe 'GET /api/conversations' do
    it 'returns empty array when user has no conversations' do
      get '/api/conversations'
      expect(json_response['conversations']).to eq([])
    end

    it 'returns user conversations with details' do
      create(:conversation_user, user: user, conversation: conversation)
      create(:message, :with_plain_text, conversation: conversation, user: user)

      get '/api/conversations'

      expect(json_response['conversations'].first).to include(
        'id' => conversation.id,
        'topic' => conversation.topic,
        'messages' => [ { 'body' => 'Plain text message', 'user_id' => user.id } ]
      )
    end
  end

  describe 'POST /api/conversations' do
    let(:valid_params) { { conversation: { topic: 'Test Topic' } } }

    it 'creates a new conversation' do
      post '/api/conversations', params: valid_params

      expect(response).to have_http_status(:ok)
      expect(json_response['conversation']['topic']).to eq('Test Topic')
      expect(Conversation.count).to eq(1)
      expect(ConversationUser.count).to eq(1)
    end
  end

  describe 'GET /api/conversations/:id' do
    it 'returns conversation details' do
      create(:conversation_user, user: user, conversation: conversation)
      create(:message, :with_plain_text, conversation: conversation, user: user)

      get "/api/conversations/#{conversation.id}"

      expect(json_response['id']).to eq(conversation.id)
      expect(json_response['messages']).to include('Plain text message')
    end
  end

  describe 'DELETE /api/conversations/:id' do
    it 'deletes the conversation' do
      create(:conversation_user, user: user, conversation: conversation)

      delete "/api/conversations/#{conversation.id}"
      expect(response).to have_http_status(:ok)
      expect(Conversation.count).to eq(0)
    end
  end
  private

  def json_response
    JSON.parse(response.body)
  end
end
