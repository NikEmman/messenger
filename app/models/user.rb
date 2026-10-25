class User < ApplicationRecord
  has_secure_password

  validates :password, length: { minimum: 6 }
  validates :password_confirmation, presence: true, if: -> { password.present? }
  validates :email, presence: true, format: { with: /\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\z/i }
  validates_uniqueness_of :email
  validates_presence_of :name

  has_many :messages, dependent: :destroy
  has_many :conversation_users, dependent: :destroy
  has_many :conversations, through: :conversation_users
  has_one :profile, dependent: :destroy

  # Presence: a user is online while they have an open Action Cable connection
  # that has sent a heartbeat recently (the window bounds stale counts left
  # behind if the server dies without running disconnect callbacks).
  ONLINE_WINDOW = 70.seconds

  def online?
    cable_connections.positive? && last_seen_at.present? && last_seen_at > ONLINE_WINDOW.ago
  end

  # Returns true when this connection brought the user online.
  def connect_cable!
    reload
    was_online = online?
    # If they looked offline, any counted connections are stale: start over.
    count = was_online ? Arel.sql("cable_connections + 1") : 1
    self.class.where(id: id).update_all(cable_connections: count, last_seen_at: Time.current)
    reload
    !was_online
  end

  # Returns true when this was the user's last open connection.
  def disconnect_cable!
    updated = self.class.where(id: id).update_all(
      Arel.sql("cable_connections = CASE WHEN cable_connections > 0 THEN cable_connections - 1 ELSE 0 END")
    )
    # Nothing to announce if the account was just deleted.
    return false if updated.zero?

    reload
    cable_connections.zero?
  end

  # Heartbeat from an open connection. Returns true if it brought the user
  # back online (e.g. after their count was reset by another connection).
  def touch_presence!
    reload
    was_online = online?
    update_columns(last_seen_at: Time.current, cable_connections: [ cable_connections, 1 ].max)
    !was_online
  end
end
