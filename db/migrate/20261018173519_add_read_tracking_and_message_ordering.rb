class AddReadTrackingAndMessageOrdering < ActiveRecord::Migration[8.0]
  def up
    add_column :conversation_users, :last_read_at, :datetime
    add_column :conversations, :last_message_at, :datetime

    add_index :messages, [ :conversation_id, :id ]
    remove_index :messages, :conversation_id
    add_index :conversations, :last_message_at

    # Backfill: sort existing conversations by their newest message, and treat
    # everything already sent as read so nobody starts with a wall of unread.
    execute <<~SQL
      UPDATE conversations SET last_message_at = (
        SELECT MAX(messages.created_at) FROM messages WHERE messages.conversation_id = conversations.id
      )
    SQL
    execute "UPDATE conversation_users SET last_read_at = CURRENT_TIMESTAMP"
  end

  def down
    remove_index :conversations, :last_message_at
    add_index :messages, :conversation_id
    remove_index :messages, [ :conversation_id, :id ]

    remove_column :conversations, :last_message_at
    remove_column :conversation_users, :last_read_at
  end
end
