FactoryBot.define do
  factory :conversation do
    topic { "Test Conversation" }

    trait :with_messages do
      after(:create) do |conversation|
        create_list(:message, 3, conversation: conversation)
      end
    end

    trait :with_users do
      after(:create) do |conversation|
        create_list(:conversation_user, 2, conversation: conversation)
      end
    end

    trait :with_messages_and_users do
      after(:create) do |conversation|
        users = create_list(:user, 2)
        users.each do |user|
          create(:conversation_user, conversation: conversation, user: user)
          create(:message, conversation: conversation, user: user)
        end
      end
    end
  end
end
