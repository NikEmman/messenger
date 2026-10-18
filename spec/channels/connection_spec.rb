require 'rails_helper'

RSpec.describe ApplicationCable::Connection, type: :channel do
  let(:user) { create(:user) }
  it 'connects with a logged-in session cookie' do
    connect '/cable', session: { user_id: user.id }

    expect(connection.current_user).to eq(user)
  end

  it 'rejects anonymous connections' do
    expect { connect '/cable' }.to have_rejected_connection
  end
end
