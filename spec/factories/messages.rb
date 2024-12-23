FactoryBot.define do
  factory :message do
    body { "Hello World" }
    association :user
    association :conversation

    trait :with_long_content do
      body { "This is a much longer message content for testing purposes." }
    end
  end
end
