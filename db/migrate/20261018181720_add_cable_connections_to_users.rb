class AddCableConnectionsToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :cable_connections, :integer, default: 0, null: false
  end
end
