class AddSeededToMessages < ActiveRecord::Migration[8.0]
  def up
    add_column :messages, :seeded, :boolean, default: false, null: false

    # Carry over the old rule, which protected the demo messages by id.
    execute "UPDATE messages SET seeded = TRUE WHERE id BETWEEN 1 AND 14"
  end

  def down
    remove_column :messages, :seeded
  end
end
