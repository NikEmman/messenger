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

puts "🦸 Creating superhero users..."

# Create Users
batman = User.create!(
  name: "Batman",
  email: "bruce.wayne@wayneenterprises.com",
  password: "gotham123",
  password_confirmation: "gotham123"
)

superman = User.create!(
  name: "Superman",
  email: "clark.kent@dailyplanet.com",
  password: "krypton123",
  password_confirmation: "krypton123"
)

joker = User.create!(
  name: "The Joker",
  email: "mrj@arkhamasylum.com",
  password: "chaos123",
  password_confirmation: "chaos123"
)

puts "✅ Created #{User.count} users"

# Create Profiles with avatars
puts "📸 Creating profiles with avatars..."

batman_profile = Profile.create!(
  user: batman,
  birthday: Date.new(1939, 5, 1), # Batman's first comic appearance
  address: "1007 Mountain Drive, Gotham City"
)

superman_profile = Profile.create!(
  user: superman,
  birthday: Date.new(1938, 4, 18), # Superman's first comic appearance
  address: "344 Clinton Street, Metropolis"
)

joker_profile = Profile.create!(
  user: joker,
  birthday: Date.new(1940, 4, 25), # Joker's first comic appearance
  address: "Arkham Asylum, Gotham City"
)

# Attach avatar images from assets
begin
  batman_image_path = Rails.root.join('db', 'seeds', 'images', 'batman.jpg')
  if File.exist?(batman_image_path)
    batman_profile.avatar.attach(
      io: File.open(batman_image_path),
      filename: 'batman.jpg',
      content_type: 'image/jpeg'
    )
    puts "  ✅ Batman avatar attached"
  else
    puts "  ⚠️  Batman image not found at #{batman_image_path}"
  end

  superman_image_path = Rails.root.join('db', 'seeds', 'images', 'superman.jpg')
  if File.exist?(superman_image_path)
    superman_profile.avatar.attach(
      io: File.open(superman_image_path),
      filename: 'superman.jpg',
      content_type: 'image/jpeg'
    )
    puts "  ✅ Superman avatar attached"
  else
    puts "  ⚠️  Superman image not found at #{superman_image_path}"
  end

  joker_image_path = Rails.root.join('db', 'seeds', 'images', 'joker.jpg')
  if File.exist?(joker_image_path)
    joker_profile.avatar.attach(
      io: File.open(joker_image_path),
      filename: 'joker.jpg',
      content_type: 'image/jpeg'
    )
    puts "  ✅ Joker avatar attached"
  else
    puts "  ⚠️  Joker image not found at #{joker_image_path}"
  end

rescue => e
  puts "  ❌ Error attaching avatars: #{e.message}"
end

puts "✅ Created #{Profile.count} profiles"

# Create Conversations
puts "💬 Creating conversations..."

# Conversation 1: Justice League Planning
justice_league_convo = Conversation.create!(
  topic: "Justice League Meeting - World Security Discussion"
)

# Add Batman and Superman to the conversation
ConversationUser.create!(user: batman, conversation: justice_league_convo)
ConversationUser.create!(user: superman, conversation: justice_league_convo)

# Conversation 2: Gotham City Crisis
gotham_crisis_convo = Conversation.create!(
  topic: "Gotham City Emergency - Joker's Latest Scheme"
)

# Add all three users to this conversation
ConversationUser.create!(user: batman, conversation: gotham_crisis_convo)
ConversationUser.create!(user: superman, conversation: gotham_crisis_convo)
ConversationUser.create!(user: joker, conversation: gotham_crisis_convo)

# Conversation 3: Private chat between heroes
hero_chat_convo = Conversation.create!(
  topic: "Hero Strategies and City Protection"
)

ConversationUser.create!(user: batman, conversation: hero_chat_convo)
ConversationUser.create!(user: superman, conversation: hero_chat_convo)

puts "✅ Created #{Conversation.count} conversations"

puts "📝 Creating messages..."

# Messages for Justice League conversation
Message.create!(
  user: batman,
  conversation: justice_league_convo,
  body: "<p>We need to discuss the recent increase in criminal activity across multiple cities. I've been tracking unusual patterns that suggest coordinated attacks.</p>",
  created_at: 2.hours.ago
)

Message.create!(
  user: superman,
  conversation: justice_league_convo,
  body: "<p>I've noticed the same thing, Bruce. Metropolis has seen some strange incidents too. We should coordinate our efforts and share intelligence.</p>",
  created_at: 1.hour.ago
)

Message.create!(
  user: batman,
  conversation: justice_league_convo,
  body: "<p>Agreed. I'll compile a report from Gotham's incidents and send it over. We need to stay one step ahead of whatever this is.</p>",
  created_at: 45.minutes.ago
)

# Messages for Gotham Crisis conversation
Message.create!(
  user: batman,
  conversation: gotham_crisis_convo,
  body: "<p>Joker has escaped Arkham again. This time he's taken over the old ACE Chemicals plant. GCPD is requesting assistance.</p>",
  created_at: 3.hours.ago
)

Message.create!(
  user: superman,
  conversation: gotham_crisis_convo,
  body: "<p>On my way to Gotham now. ETA 5 minutes. What's his play this time?</p>",
  created_at: 2.hours.ago + 30.minutes
)

Message.create!(
  user: joker,
  conversation: gotham_crisis_convo,
  body: "<p>HAHAHA! Welcome to my chemical comedy show, boys! 🃏 The punchline is going to be EXPLOSIVE! You'll never catch me this time!</p>",
  created_at: 2.hours.ago + 15.minutes
)

Message.create!(
  user: batman,
  conversation: gotham_crisis_convo,
  body: "<p>Joker, whatever you're planning, it ends now. Innocent people could get hurt.</p>",
  created_at: 2.hours.ago
)

Message.create!(
  user: joker,
  conversation: gotham_crisis_convo,
  body: "<p>Oh Batsy, you always take things so seriously! Can't a clown have a little fun? The real joke is that you think you can stop me! AHAHAHA!</p>",
  created_at: 1.hour.ago + 45.minutes
)

Message.create!(
  user: superman,
  conversation: gotham_crisis_convo,
  body: "<p>The area is secure. No civilians were harmed. Joker is back in custody, but we need to figure out how he keeps escaping.</p>",
  created_at: 1.hour.ago + 15.minutes
)

# Messages for Hero Strategy conversation
Message.create!(
  user: batman,
  conversation: hero_chat_convo,
  body: "<p>Clark, I've been thinking about our approach to crime fighting. We need better coordination between Gotham and Metropolis.</p>",
  created_at: 5.hours.ago
)

Message.create!(
  user: superman,
  conversation: hero_chat_convo,
  body: "<p>You're right, Bruce. Maybe we should set up a secure communication system that can't be intercepted by criminals.</p>",
  created_at: 4.hours.ago + 30.minutes
)

Message.create!(
  user: batman,
  conversation: hero_chat_convo,
  body: "<p>I'm already working on something. Encrypted quantum communication with real-time threat analysis. Should be ready next week.</p>",
  created_at: 4.hours.ago
)

Message.create!(
  user: superman,
  conversation: hero_chat_convo,
  body: "<p>Impressive as always. Your tech skills never cease to amaze me. This could revolutionize how we protect our cities.</p>",
  created_at: 3.hours.ago + 45.minutes
)

Message.create!(
  user: batman,
  conversation: hero_chat_convo,
  body: "<p>Technology is only as good as the people using it. We need to stay vigilant and keep training. The threats are evolving.</p>",
  created_at: 3.hours.ago + 15.minutes
)

puts "✅ Created #{Message.count} messages"

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
