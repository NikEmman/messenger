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

      it 'returns summaries of conversations the user belongs to' do
        create(:conversation_user, user: user, conversation: conversation)
        message = create(:message, :with_plain_text, conversation: conversation, user: user)
        others_conversation

        get '/api/conversations'

        expect(json_response['conversations'].map { |c| c['id'] }).to eq([ conversation.id ])
        summary = json_response['conversations'].first
        expect(summary).to include('topic' => conversation.topic, 'unread_count' => 0)
        expect(summary['last_message']).to include('id' => message.id, 'preview' => 'Plain text message')
        expect(summary).not_to have_key('messages')
      end

      it 'orders conversations by most recent activity' do
        quiet = create(:conversation, topic: 'Quiet', created_at: 1.day.ago)
        busy = create(:conversation, topic: 'Busy', created_at: 2.days.ago)
        [ quiet, busy ].each { |c| create(:conversation_user, user: user, conversation: c) }
        create(:message, conversation: busy)

        get '/api/conversations'

        expect(json_response['conversations'].map { |c| c['topic'] }).to eq(%w[Busy Quiet])
      end

      it "counts unread messages from others since the user's last read" do
        create(:conversation_user, user: user, conversation: conversation, last_read_at: 1.hour.ago)
        create(:message, conversation: conversation, created_at: 2.hours.ago)
        create_list(:message, 2, conversation: conversation)
        create(:message, conversation: conversation, user: user)

        get '/api/conversations'

        expect(json_response['conversations'].first['unread_count']).to eq(2)
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

    describe 'POST /api/conversations/:id/read' do
      it 'marks the conversation as read for the current user' do
        membership = create(:conversation_user, user: user, conversation: conversation)
        create(:message, conversation: conversation)

        post "/api/conversations/#{conversation.id}/read"

        expect(response).to have_http_status(:no_content)
        expect(membership.reload.last_read_at).to be_within(5.seconds).of(Time.current)
        get '/api/conversations'
        expect(json_response['conversations'].first['unread_count']).to eq(0)
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
