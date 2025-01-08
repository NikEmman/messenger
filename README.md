# MESSAGING APP

## Description

This is a messaging application where a user, after registering, can start a conversation and add other registered users to that conversation.

### App Features

- A user can sent messages with rich text (format the text with bold, headline, italic, list styles etc.)
- Users can create profiles with personal info and an avatar, which is then displayed at a conversation that they participate.
- Users can update their profile info, or change avatars.
- Users can see other users' profiles by clicking a particular user's avatar.

## Technical description

The app architecture is a monolith Rails app, which provides a single view template as a root, on which the React front end is then rendered, using ESbuild as a bundler.

### Technical features

- Back-end
  - DB: PostgreSQL
  - Rails controllers as api endpoints
  - Unit tests for models and controllers (Rspec)
  - Custom user authentication / authorization
  - Model validation
- Front-end
  - Showcase of current React skills, passing state up and down the chain, context, api calls, routing
  - Form validation to complement back-end
  - Unit test for all components

### External resources

- Rich text library [React-Quill](https://quilljs.com/playground/react)
