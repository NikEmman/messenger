FactoryBot.define do
  factory :profile do
    address { "123 Main St" }
    birthday { "1990-01-01" }
    association :user

    trait :with_avatar do
      after(:build) do |profile|
        # Create a test file attachment
        profile.avatar.attach(
          io: File.open(Rails.root.join('spec', 'fixtures', 'files', 'test_avatar.jpg')),
          filename: 'test_avatar.jpg',
          content_type: 'image/jpeg'
        )
      end
    end
  end
end
