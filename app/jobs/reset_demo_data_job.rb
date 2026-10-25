class ResetDemoDataJob < ApplicationJob
  queue_as :default

  # A simultaneous reset (e.g. on login) seeded the accounts first; that one stands.
  discard_on ActiveRecord::RecordNotUnique

  IDLE_FOR = 30.minutes

  # Compared with true because an unset config.x key is an empty (truthy)
  # OrderedOptions rather than nil.
  def self.enabled?
    Rails.configuration.x.reset_demo_data == true
  end

  # Queued whenever a demo account's last connection closes. If someone is
  # back on a demo account when it runs it does nothing; their own
  # disconnect queues the next one.
  def self.schedule
    set(wait: IDLE_FOR).perform_later if enabled?
  end

  # Due once a demo account has been used since the last reset and none has
  # been seen for IDLE_FOR, or when an account is missing altogether.
  def self.due?
    users = DemoData.users.to_a
    return true if users.size < DemoData::EMAILS.size

    users.all? { |user| user.last_seen_at.nil? || user.last_seen_at < IDLE_FOR.ago } &&
      users.any? { |user| user.last_seen_at && user.last_seen_at > user.created_at }
  end

  # Deletes the demo accounts with everything they posted (see
  # AccountRemoval), then seeds them afresh.
  def perform
    ActiveRecord::Base.transaction do
      users = DemoData.users.lock.to_a
      # Recheck under the lock: a simultaneous reset may have just run.
      next unless self.class.due?

      AccountRemoval.remove(users)
      DemoData.seed!
    end
  end
end
