Rails.application.routes.draw do
  root "homepage#index"
  get "up" => "rails/health#show", as: :rails_health_check

  get "*path", to: "homepage#index", constraints: ->(req) { req.format.html? && !req.path.start_with?("/images", "/assets") }
end
