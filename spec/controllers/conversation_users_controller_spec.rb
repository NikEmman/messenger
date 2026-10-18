require 'rails_helper'

RSpec.describe Api::ConversationUsersController, type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:conversation) { create(:conversation) }

  before { login_user(user) }

  describe 'POST /api/conversation_users' do
    it 'lets a member add another user' do
      create(:conversation_user, user: user, conversation: conversation)

      post '/api/conversation_users', params: { conversation_id: conversation.id, user_id: other_user.id }

      expect(response).to have_http_status(:created)
      expect(json_response['member']).to include('id' => other_user.id, 'membership_id' => be_present)
      expect(json_response['member']).not_to have_key('password_digest')
    end

    it 'pushes the conversation to the added user and the new member to others' do
      third = create(:user)
      create(:conversation_user, user: user, conversation: conversation)
      create(:conversation_user, user: third, conversation: conversation)

      expect {
        post '/api/conversation_users', params: { conversation_id: conversation.id, user_id: other_user.id }
      }.to have_broadcasted_to(InboxChannel.broadcasting_for(other_user))
        .with(a_hash_including(type: "conversation_added"))
        .and have_broadcasted_to(InboxChannel.broadcasting_for(third))
        .with(a_hash_including(type: "member_added", conversation_id: conversation.id))
    end

    it 'rejects adding someone who is already a member' do
      create(:conversation_user, user: user, conversation: conversation)
      create(:conversation_user, user: other_user, conversation: conversation)

      post '/api/conversation_users', params: { conversation_id: conversation.id, user_id: other_user.id }

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'does not let non-members add people' do
      post '/api/conversation_users', params: { conversation_id: conversation.id, user_id: user.id }

      expect(response).to have_http_status(:not_found)
      expect(conversation.users).to be_empty
    end
  end

  describe 'DELETE /api/conversation_users/:id' do
    context 'when current user is a member of the conversation' do
      it 'removes a user from the conversation' do
        create(:conversation_user, user: user, conversation: conversation)
        membership = create(:conversation_user, user: other_user, conversation: conversation)

        delete "/api/conversation_users/#{membership.id}"

        expect(response).to have_http_status(:ok)
        expect(json_response).to eq('conversation_deleted' => false, 'removed_user_id' => other_user.id)
        expect(ConversationUser.exists?(membership.id)).to be false
      end

      it 'tells the removed user to drop the conversation' do
        create(:conversation_user, user: user, conversation: conversation)
        membership = create(:conversation_user, user: other_user, conversation: conversation)

        expect {
          delete "/api/conversation_users/#{membership.id}"
        }.to have_broadcasted_to(InboxChannel.broadcasting_for(other_user))
          .with(type: "conversation_removed", conversation_id: conversation.id)
      end

      it 'deletes the conversation when last user is removed' do
        membership = create(:conversation_user, user: user, conversation: conversation)

        delete "/api/conversation_users/#{membership.id}"

        expect(response).to have_http_status(:ok)
        expect(json_response['conversation_deleted']).to eq(true)
        expect(Conversation.exists?(conversation.id)).to be false
      end
    end

    it 'does not let non-members remove people' do
      membership = create(:conversation_user, user: other_user, conversation: conversation)

      delete "/api/conversation_users/#{membership.id}"

      expect(response).to have_http_status(:not_found)
      expect(ConversationUser.exists?(membership.id)).to be true
    end

    it 'returns not found for unknown memberships' do
      delete '/api/conversation_users/99999'

      expect(response).to have_http_status(:not_found)
    end
  end
end
