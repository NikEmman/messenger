class CreateProfiles < ActiveRecord::Migration[8.0]
  def change
    create_table :profiles do |t|
      t.date :birthday
      t.references :user, null: false, foreign_key: true
      t.string :address

      t.timestamps
    end
  end
end
