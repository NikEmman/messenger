# db/seeds.rb

# Clear existing data in development
if Rails.env.development?
  puts "🧹 Cleaning up existing data..."
  ConversationUser.destroy_all
  Message.destroy_all
  Conversation.destroy_all
  Profile.destroy_all
  User.destroy_all
  puts "✅ Data cleared!"
end

puts "🦸 Creating demo accounts and conversations..."
DemoData.seed!

# Display summary
puts "\n🎭 Seed data summary:"
puts "👥 Users: #{User.count}"
puts "📋 Profiles: #{Profile.count}"
puts "💬 Conversations: #{Conversation.count}"
puts "📝 Messages: #{Message.count}"
puts "🔗 Conversation Users: #{ConversationUser.count}"

puts "\n🦸‍♂️ Users created:"
User.all.each do |user|
  puts "  - #{user.name} (#{user.email})"
end

puts "\n💬 Conversations created:"
Conversation.all.each do |conv|
  puts "  - #{conv.topic} (#{conv.users.pluck(:name).join(', ')})"
end

puts "\n🎉 Seeding completed successfully!"
