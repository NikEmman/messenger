require 'spec_helper'
ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
abort("The Rails environment is running in production mode!") if Rails.env.production?
require 'rspec/rails'
require 'support/auth_helper'

begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

RSpec.configure do |config|
  config.fixture_paths = [Rails.root.join('spec/fixtures')]
  
  # This rolls back the DB (including active_storage_db records) automatically!
  config.use_transactional_fixtures = true

  config.filter_rails_from_backtrace!

  # Helpers for your agents
  config.include AuthHelper, type: :request
  config.include FactoryBot::Syntax::Methods

  # Optimization: Only purge if you aren't using the DB service for tests, 
  # but since you have active_storage_db, you can safely remove the manual purge.
  # If you ever switch back to Disk storage in test, use a local temp folder instead.
end