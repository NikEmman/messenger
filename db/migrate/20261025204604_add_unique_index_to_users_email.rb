# The uniqueness validation alone lets two simultaneous inserts through, e.g.
# two demo resets seeding the same accounts.
class AddUniqueIndexToUsersEmail < ActiveRecord::Migration[8.1]
  def change
    add_index :users, :email, unique: true
  end
end
