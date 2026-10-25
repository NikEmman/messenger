# Deletes visitors' accounts once they have gone unused for INACTIVE_FOR, so
# the public app doesn't pile up abandoned accounts and their messages. The
# demo accounts are left to ResetDemoDataJob. Runs daily (config/recurring.yml).
class DeleteInactiveAccountsJob < ApplicationJob
  queue_as :default

  INACTIVE_FOR = 2.weeks

  # last_seen_at is only set once a user connects, so fall back to sign-up.
  def self.inactive_users
    User.where.not(email: DemoData::EMAILS)
      .where("COALESCE(last_seen_at, created_at) < ?", INACTIVE_FOR.ago)
  end

  # One account at a time, so a failure doesn't hold back the rest.
  def perform
    self.class.inactive_users.find_each do |user|
      AccountRemoval.remove(user)
    rescue ActiveRecord::ActiveRecordError => e
      Rails.error.report(e, context: { user_id: user.id })
    end
  end
end
