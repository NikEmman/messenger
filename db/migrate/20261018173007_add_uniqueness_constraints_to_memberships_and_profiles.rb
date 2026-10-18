class AddUniquenessConstraintsToMembershipsAndProfiles < ActiveRecord::Migration[8.0]
  def up
    # Drop duplicate rows (keeping the oldest) so the unique indexes can be built.
    execute <<~SQL
      DELETE FROM conversation_users WHERE id NOT IN (
        SELECT MIN(id) FROM conversation_users GROUP BY user_id, conversation_id
      )
    SQL
    execute <<~SQL
      DELETE FROM profiles WHERE id NOT IN (
        SELECT MIN(id) FROM profiles GROUP BY user_id
      )
    SQL

    add_index :conversation_users, [ :conversation_id, :user_id ], unique: true
    remove_index :conversation_users, :conversation_id

    remove_index :profiles, :user_id
    add_index :profiles, :user_id, unique: true
  end

  def down
    remove_index :profiles, :user_id
    add_index :profiles, :user_id

    add_index :conversation_users, :conversation_id
    remove_index :conversation_users, [ :conversation_id, :user_id ]
  end
end
