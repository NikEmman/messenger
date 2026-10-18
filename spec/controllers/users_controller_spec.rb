require 'rails_helper'

RSpec.describe 'Api::Users', type: :request do
  let(:user) { create(:user, name: 'Bruce') }
  let!(:clark) { create(:user, name: 'Clark', email: 'clark@dailyplanet.com') }
  let!(:diana) { create(:user, name: 'Diana', email: 'diana@themyscira.com') }

  it 'requires login' do
    get '/api/users'

    expect(response).to have_http_status(:unauthorized)
  end

  context 'when logged in' do
    before { login_user(user) }

    it 'lists other users without private fields' do
      get '/api/users'

      expect(response).to have_http_status(:ok)
      expect(json_response['users'].map { |u| u['id'] }).to contain_exactly(clark.id, diana.id)
      expect(json_response['users'].first.keys).to contain_exactly('id', 'name', 'email', 'avatar_url')
    end

    it 'filters by name or email, case-insensitively' do
      get '/api/users', params: { q: 'DAILYPLANET' }
      expect(json_response['users'].map { |u| u['id'] }).to eq([ clark.id ])

      get '/api/users', params: { q: 'dia' }
      expect(json_response['users'].map { |u| u['id'] }).to eq([ diana.id ])
    end
  end
end
