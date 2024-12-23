FactoryBot.define do
  factory :conversation_user do
    association :user
    association :conversation
  end
end
