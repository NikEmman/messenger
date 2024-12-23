FactoryBot.define do
  factory :conversation do
    topic { "Test Conversation" }

    trait :with_users do
      after(:create) do |conversation|
        create_list(:conversation_user, 2, conversation: conversation)
      end
    end
  end
end
