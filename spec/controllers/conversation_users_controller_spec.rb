require 'rails_helper'

RSpec.describe Api::ConversationUsersController, type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:conversation) { create(:conversation) }

  before do
    login_user(user)
  end

  describe 'DELETE /api/conversation_users/:id' do
    context 'when current user is a member of the conversation' do
      it 'removes a user from the conversation' do
        create(:conversation_user, user: user, conversation: conversation)
        membership = create(:conversation_user, user: other_user, conversation: conversation)

        delete "/api/conversation_users/#{membership.id}"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['message']).to eq('User removed from conversation')
        expect(json['conversation_deleted']).to eq(false)
        expect(ConversationUser.exists?(membership.id)).to be false
      end

      it 'deletes the conversation when last user is removed' do
        # Only user is in the conversation, so removing them deletes the conversation
        membership = create(:conversation_user, user: user, conversation: conversation)

        delete "/api/conversation_users/#{membership.id}"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['message']).to eq('User removed and conversation deleted (was empty)')
        expect(json['conversation_deleted']).to eq(true)
        expect(Conversation.exists?(conversation.id)).to be false
      end
    end

    context 'when current user is NOT a member of the conversation' do
      it 'returns forbidden status' do
        # user is not added to the conversation
        membership = create(:conversation_user, user: other_user, conversation: conversation)

        delete "/api/conversation_users/#{membership.id}"

        expect(response).to have_http_status(:forbidden)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('You must be a member of this conversation to remove members')
      end
    end

    context 'when membership does not exist' do
      it 'returns not found status' do
        delete '/api/conversation_users/99999'

        expect(response).to have_http_status(:not_found)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('Membership not found')
      end
    end
  end

  private

  def json_response
    JSON.parse(response.body)
  end
end
