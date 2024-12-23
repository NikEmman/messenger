FactoryBot.define do
  factory :user do
    name { "John Doe" }
    sequence(:email) { |n| "user#{n}@example.com" }
    password { "password123" }
    password_confirmation { "password123" }

    trait :with_profile do
      after(:create) do |user|
        create(:profile, user: user)
      end
    end

    trait :with_messages do
      after(:create) do |user|
        create_list(:message, 2, user: user)
      end
    end

    trait :with_conversations do
      after(:create) do |user|
        create_list(:conversation_user, 2, user: user)
      end
    end
  end
end
