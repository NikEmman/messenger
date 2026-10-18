module Api
  class UsersController < BaseController
    SEARCH_LIMIT = 20

    # GET /api/users?q=term — people the current user can add to a conversation.
    def index
      users = User.where.not(id: @current_user.id)
        .includes(profile: { avatar_attachment: :blob })
        .order(:name)
        .limit(SEARCH_LIMIT)

      if params[:q].present?
        term = "%#{User.sanitize_sql_like(params[:q].downcase)}%"
        users = users.where("LOWER(name) LIKE :term OR LOWER(email) LIKE :term", term: term)
      end

      render json: { users: users.map { |user| user_json(user) } }
    end
  end
end
