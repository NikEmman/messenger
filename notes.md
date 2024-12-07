### Database Schema for Conversations

#### Users Table

- `id`: Primary key.
- `email`: String.
- `password_digest`: String (using bcrypt for password hashing).

#### Conversations Table

- `id`: Primary key.
- `topic`: String.

#### Messages Table

- `id`: Primary key.
- `content`: Text.
- `user_id`: Foreign key to `users`.
- `conversation_id`: Foreign key to `conversations`.

#### ConversationUser Table

- `id`: Primary key.
- `user_id`: Foreign key to `users`.
- `conversation_id`: Foreign key to `conversations`.

### Associations in Rails Models

#### User Model

```ruby
class User < ApplicationRecord
  has_secure_password
  has_many :messages
  has_many :conversation_users
  has_many :conversations, through: :conversation_users
end
```

#### Conversation Model

```ruby
class Conversation < ApplicationRecord
  has_many :messages
  has_many :conversation_users
  has_many :users, through: :conversation_users
end
```

#### Message Model

```ruby
class Message < ApplicationRecord
  belongs_to :user
  belongs_to :conversation
end
```

#### ConversationUser Model

```ruby
class ConversationUser < ApplicationRecord
  belongs_to :user
  belongs_to :conversation
end
```
