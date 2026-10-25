module Api
  class AccountsController < BaseController
    # Caps password guesses from a logged-in session.
    rate_limit to: 5, within: 1.minute, by: -> { @current_user.id }, only: :destroy,
               with: -> { render json: { error: "Too many attempts, try again in a minute" }, status: :too_many_requests }

    # DELETE /api/account — the current user deletes their own account, after
    # confirming their password. See AccountRemoval for what goes with it.
    def destroy
      if DemoData.account?(@current_user)
        render json: { error: "Demo accounts can't be deleted" }, status: :forbidden
      elsif !@current_user.authenticate(params.require(:password))
        render json: { error: "Wrong password" }, status: :unauthorized
      else
        AccountRemoval.remove(@current_user)
        reset_session
        head :no_content
      end
    end
  end
end
