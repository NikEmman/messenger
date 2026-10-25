module Api
  class AccountsController < BaseController
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
