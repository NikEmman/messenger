# The three hero accounts visitors can sign in as, and the conversations
# they come with. Used by db/seeds.rb and by ResetDemoDataJob, which wipes
# and recreates these accounts once nobody has used them for a while.
module DemoData
  ACCOUNTS = [
    { key: :batman, name: "Batman", email: "bruce.wayne@wayneenterprises.com", password: "gotham123",
      birthday: Date.new(1939, 5, 1), address: "1007 Mountain Drive, Gotham City", avatar: "batman.jpg" },
    { key: :superman, name: "Superman", email: "clark.kent@dailyplanet.com", password: "krypton123",
      birthday: Date.new(1938, 4, 18), address: "344 Clinton Street, Metropolis", avatar: "superman.jpg" },
    { key: :joker, name: "The Joker", email: "mrj@arkhamasylum.com", password: "chaos123",
      birthday: Date.new(1940, 4, 25), address: "Arkham Asylum, Gotham City", avatar: "joker.jpg" }
  ].freeze

  EMAILS = ACCOUNTS.map { |account| account[:email] }.freeze

  # Each conversation is a script of [author, body] lines sent a few minutes
  # apart, starting `started_minutes_ago`, so timestamps always move forward.
  CONVERSATIONS = [
    {
      topic: "Hero Strategies and City Protection",
      members: %i[batman superman],
      started_minutes_ago: 300,
      lines: [
        [ :batman, "<p>Clark, I've been thinking about our approach to crime fighting. We need better coordination between Gotham and Metropolis.</p>" ],
        [ :superman, "<p>You're right, Bruce. Maybe we should set up a secure communication system that can't be intercepted by criminals.</p>" ],
        [ :batman, "<p>I'm already working on something. Encrypted quantum communication with real-time threat analysis. Should be ready next week.</p>" ],
        [ :superman, "<p>Impressive as always. Your tech skills never cease to amaze me. This could revolutionize how we protect our cities.</p>" ],
        [ :batman, "<p>Technology is only as good as the people using it. We need to stay vigilant and keep training. The threats are evolving.</p>" ]
      ]
    },
    {
      topic: "Justice League Meeting - World Security Discussion",
      members: %i[batman superman],
      started_minutes_ago: 150,
      lines: [
        [ :batman, "<p>We need to discuss the recent increase in criminal activity across multiple cities. I've been tracking unusual patterns that suggest coordinated attacks.</p>" ],
        [ :superman, "<p>I've noticed the same thing, Bruce. Metropolis has seen some strange incidents too. We should coordinate our efforts and share intelligence.</p>" ],
        [ :batman, "<p>Agreed. I'll compile a report from Gotham's incidents and send it over. We need to stay one step ahead of whatever this is.</p>" ]
      ]
    },
    {
      topic: "Gotham City Emergency - Joker's Latest Scheme",
      members: %i[batman superman joker],
      started_minutes_ago: 60,
      lines: [
        [ :batman, "<p>Joker has escaped Arkham again. This time he's taken over the old ACE Chemicals plant. GCPD is requesting assistance.</p>" ],
        [ :superman, "<p>On my way to Gotham now. ETA 5 minutes. What's his play this time?</p>" ],
        [ :joker, "<p>HAHAHA! Welcome to my chemical comedy show, boys! 🃏 The punchline is going to be EXPLOSIVE! You'll never catch me this time!</p>" ],
        [ :batman, "<p>Joker, whatever you're planning, it ends now. Innocent people could get hurt.</p>" ],
        [ :joker, "<p>Oh Batsy, you always take things so seriously! Can't a clown have a little fun? The real joke is that you think you can stop me! AHAHAHA!</p>" ],
        [ :superman, "<p>The area is secure. No civilians were harmed. Joker is back in custody, but we need to figure out how he keeps escaping.</p>" ]
      ]
    }
  ].freeze

  AVATAR_DIR = Rails.root.join("db", "seeds", "images")

  def self.users
    User.where(email: EMAILS)
  end

  def self.account?(user)
    EMAILS.include?(user.email)
  end

  # Creates the accounts with their profiles, avatars and conversations.
  def self.seed!
    users = ACCOUNTS.to_h do |account|
      user = User.create!(account.slice(:name, :email, :password).merge(password_confirmation: account[:password]))
      profile = Profile.create!(user: user, birthday: account[:birthday], address: account[:address])
      avatar = AVATAR_DIR.join(account[:avatar])
      profile.avatar.attach(io: File.open(avatar), filename: account[:avatar], content_type: "image/jpeg") if avatar.exist?
      [ account[:key], user ]
    end

    CONVERSATIONS.each do |script|
      conversation = Conversation.create!(topic: script[:topic])
      script[:members].each { |key| conversation.conversation_users.create!(user: users[key]) }
      script[:lines].each_with_index do |(key, body), index|
        conversation.messages.create!(user: users[key], body: body, seeded: true,
                                      created_at: (script[:started_minutes_ago] - index * 7).minutes.ago)
      end
    end
  end
end
