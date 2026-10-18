module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    # Reuse the Rails session that the JSON API logs users in with.
    def find_verified_user
      User.find_by(id: request.session[:user_id]) || reject_unauthorized_connection
    end
  end
end
