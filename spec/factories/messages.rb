FactoryBot.define do
  factory :message do
    association :user
    association :conversation

    trait :with_rich_text do
      after(:build) do |message|
        message.body = ActionText::Content.new('<div>Hello, this is a <strong>rich text</strong> message!</div>')
      end
    end

    trait :with_plain_text do
      after(:build) do |message|
        message.body = 'Plain text message'
      end
    end
  end
end
