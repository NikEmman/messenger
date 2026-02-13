FactoryBot.define do
  factory :attachment_helper do
    # A helper method to generate a mock file
    trait :with_image do
      image { Rack::Test::UploadedFile.new(Rails.root.join('spec/fixtures/files/test.png'), 'image/png') }
    end
  end
end