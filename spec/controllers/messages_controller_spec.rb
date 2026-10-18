require 'rails_helper'

RSpec.describe 'Api::Messages', type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:conversation) { create(:conversation) }
  let(:messages_path) { "/api/conversations/#{conversation.id}/messages" }

  it 'requires login' do
    post messages_path, params: { message: { body: 'Hi' } }

    expect(response).to have_http_status(:unauthorized)
  end

  context 'when logged in' do
    before { login_user(user) }

    context 'as a member of the conversation' do
      before { create(:conversation_user, user: user, conversation: conversation) }

      describe 'GET messages' do
        it 'returns the newest page oldest-first and says whether more exist' do
          messages = create_list(:message, Api::MessagesController::PAGE_SIZE + 5, conversation: conversation)

          get messages_path

          expect(json_response['messages'].map { |m| m['id'] }).to eq(messages.last(Api::MessagesController::PAGE_SIZE).map(&:id))
          expect(json_response['has_more']).to be true
        end

        it 'pages backwards with ?before=' do
          messages = create_list(:message, Api::MessagesController::PAGE_SIZE + 5, conversation: conversation)
          oldest_loaded = messages.last(Api::MessagesController::PAGE_SIZE).first

          get messages_path, params: { before: oldest_loaded.id }

          expect(json_response['messages'].map { |m| m['id'] }).to eq(messages.first(5).map(&:id))
          expect(json_response['has_more']).to be false
        end
      end

      describe 'POST messages' do
        it 'creates a message authored by the current user' do
          expect {
            post messages_path, params: { message: { body: 'Hi' } }
          }.to change(Message, :count).by(1)

          expect(response).to have_http_status(:created)
          expect(json_response['message']).to include('user_id' => user.id, 'conversation_id' => conversation.id)
          expect(json_response['message']['body']).to include('Hi')
        end

        it 'broadcasts the message to every member' do
          friend = create(:user)
          create(:conversation_user, user: friend, conversation: conversation)

          expect {
            post messages_path, params: { message: { body: 'Hi' } }
          }.to have_broadcasted_to(InboxChannel.broadcasting_for(friend))
            .with(a_hash_including(type: "message"))
        end

        it 'sanitizes message HTML so it cannot run scripts' do
          post messages_path, params: { message: { body: '<b>hi</b><img src=x onerror="alert(1)"><script>alert(2)</script>' } }

          body = json_response['message']['body']
          expect(body).to include('<b>hi</b>')
          expect(body).not_to include('onerror', '<script')

          get messages_path
          expect(json_response['messages'].last['body']).not_to include('onerror')
        end

        it 'echoes the client_id used for optimistic rendering' do
          post messages_path, params: { message: { body: 'Hi', client_id: 'tmp-123' } }

          expect(json_response['message']['client_id']).to eq('tmp-123')
        end

        it 'ignores a spoofed user_id' do
          post messages_path, params: { message: { body: 'Hi', user_id: other_user.id } }

          expect(Message.last.user).to eq(user)
        end

        it 'bumps the conversation activity timestamp' do
          post messages_path, params: { message: { body: 'Hi' } }

          expect(conversation.reload.last_message_at).to eq(Message.last.created_at)
        end

        it 'rejects an empty body' do
          post messages_path, params: { message: { body: '' } }

          expect(response).to have_http_status(:bad_request).or have_http_status(:unprocessable_entity)
          expect(Message.count).to eq(0)
        end
      end
    end

    it 'cannot read or post in a conversation the user is not a member of' do
      create(:message, conversation: conversation)

      get messages_path
      expect(response).to have_http_status(:not_found)

      expect {
        post messages_path, params: { message: { body: 'Hi' } }
      }.not_to change(Message, :count)
      expect(response).to have_http_status(:not_found)
    end
  end
end
