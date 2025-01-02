module AuthHelper
  def login_user(user)
    post '/api/login', params: { user: { email: user.email, password: user.password } }
  end
end

RSpec.configure do |config|
  config.include AuthHelper, type: :request
end
