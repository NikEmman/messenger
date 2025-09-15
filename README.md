# MESSAGING APP

## Description

This is a messaging application where a user, after registering, can start a conversation and add other registered users to that conversation.

### App Features

- A user can send messages with rich text (format the text with bold, headline, italic, list styles etc.)
- Users can create profiles with personal info and an avatar, which is then displayed at a conversation that they participate.
- Users can update their profile info, or change avatars.
- Users can see other users' profiles by clicking a particular user's avatar.

## Technical description

The app architecture is a monolith Rails app, which provides a single view template as a root, on which the React front end is then rendered, using ESbuild as a bundler.

### Technical features

- Back-end
  - DB: PostgreSQL
  - Rails controllers as api endpoints
  - Custom authentication / authorization
  - Unit tests for models and controllers (Rspec)
  - Model validation
- Front-end
  - Showcase of current React skills, passing state up and down the chain, context, API calls, routing
  - Form validation to complement back-end
  - Unit test for all components

### External resources

- Rich text library [React-Quill](https://quilljs.com/playground/react)

### How to install locally

- Download the [github repo](https://github.com/NikEmman/messenger)
- Open console, navigate into the project folder, run the commands `bundle`, `yarn`, `rails db:create` and `rails db:migrate` to install dependencies

### How to run tests

- Install first, see above
- Run the command `rspec` for rails tests, `yarn jest` for the React tests
- To view the project, boot a local server to run the project with the command `bin/dev`, open a browser and visit [local host](http://localhost:3000/)

### Live version

[Messenger](https://messenger-lr1s.onrender.com) deployed on Render

Login with one of the following sample accounts, or create your own!

- Batman:

  - email: bruce.wayne@wayneenterprises.com,
  - password: gotham123

- Superman:
  - email: clark.kent@dailyplanet.com,
  - password: krypton123
- The Joker:
  - email: mrj@arkhamasylum.com,
  - password: chaos123

### What I learned

- How to build custom session-based authentication
- How to integrate Rails API with React frontend

### Key challenges

- Deployment challenges including configuring the Rails/React build process for production
