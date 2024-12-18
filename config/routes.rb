Rails.application.routes.draw do
  namespace :api do
    resources :profiles, only: [ :create, :show, :destroy, :update ]
    resources :sessions, only: [ :create ]
    resources :registrations, only: [ :create ]
    delete :logout, to: "sessions#logout"
    get :logged_in, to: "sessions#logged_in"

    resources :conversations, only: [ :index, :show, :destroy, :create ]
    resources :conversation_users, only: [ :create ]
    resources :messages, only: [ :create ]
    get "/other_users", to: "sessions#other_users"
  end
  root "homepage#index"
  get "up" => "rails/health#show", as: :rails_health_check

  get "/messages", to: "homepage#index"
  get "/profile", to: "homepage#index"
  get "/signup", to: "homepage#index"
  get "*path", to: "homepage#index", constraints: ->(req) { req.format.html? && !req.path.start_with?("/images", "/assets") }
end
