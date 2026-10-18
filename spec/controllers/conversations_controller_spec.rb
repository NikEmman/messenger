require 'rails_helper'

RSpec.describe Api::ConversationsController, type: :request do
  let(:user) { create(:user) }
  let(:conversation) { create(:conversation) }
  let(:others_conversation) { create(:conversation, :with_users) }

  it 'requires login' do
    get '/api/conversations'

    expect(response).to have_http_status(:unauthorized)
  end

  context 'when logged in' do
    before { login_user(user) }

    describe 'GET /api/conversations' do
      it 'returns empty array when user has no conversations' do
        get '/api/conversations'
        expect(json_response['conversations']).to eq([])
      end

      it 'returns only conversations the user belongs to' do
        create(:conversation_user, user: user, conversation: conversation)
        create(:message, :with_plain_text, conversation: conversation, user: user)
        others_conversation

        get '/api/conversations'

        expect(json_response['conversations'].map { |c| c['id'] }).to eq([ conversation.id ])
        expect(json_response['conversations'].first).to include(
          'topic' => conversation.topic,
          'messages' => [ a_hash_including('body' => a_string_including('Plain text message'), 'user_id' => user.id) ]
        )
      end
    end

    describe 'POST /api/conversations' do
      it 'creates a conversation with the current user as member' do
        post '/api/conversations', params: { conversation: { topic: 'Test Topic' } }

        expect(response).to have_http_status(:created)
        expect(json_response['conversation']['topic']).to eq('Test Topic')
        expect(json_response['conversation']['members'].map { |m| m['id'] }).to eq([ user.id ])
      end

      it 'rejects a blank topic' do
        post '/api/conversations', params: { conversation: { topic: '' } }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to include("Topic can't be blank")
        expect(Conversation.count).to eq(0)
      end
    end

    describe 'GET /api/conversations/:id' do
      it 'returns conversation details to members' do
        create(:conversation_user, user: user, conversation: conversation)

        get "/api/conversations/#{conversation.id}"

        expect(response).to have_http_status(:ok)
        expect(json_response['id']).to eq(conversation.id)
      end

      it 'hides conversations the user is not a member of' do
        get "/api/conversations/#{others_conversation.id}"

        expect(response).to have_http_status(:not_found)
      end
    end

    describe 'DELETE /api/conversations/:id' do
      it 'deletes the conversation for members' do
        create(:conversation_user, user: user, conversation: conversation)

        delete "/api/conversations/#{conversation.id}"

        expect(response).to have_http_status(:no_content)
        expect(Conversation.exists?(conversation.id)).to be false
      end

      it "cannot delete someone else's conversation" do
        delete "/api/conversations/#{others_conversation.id}"

        expect(response).to have_http_status(:not_found)
        expect(Conversation.exists?(others_conversation.id)).to be true
      end
    end
  end
end
