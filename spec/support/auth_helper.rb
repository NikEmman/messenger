module AuthHelper
  def login_user(user)
    post '/api/sessions', params: { user: { email: user.email, password: user.password } }
  end
end
