FactoryBot.define do
  factory :profile do
    address { "123 Main St" }
    birthday { "1990-01-01" }
    association :user
  end
end
