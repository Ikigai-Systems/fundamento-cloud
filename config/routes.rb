Rails.application.routes.draw do
  devise_for :users, :controllers => { registrations: 'registrations'}

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Add in our Websocket route
  mount ActionCable.server => '/cable'

  # Defines the root path route ("/")
  root "root#index"

  resources :documents, only: [:edit, :update]

  resources :organizations

  namespace :api do
    namespace :v1 do
      resources :documents
      resources :spaces
      resources :attachments, only: [:create, :destroy, :show]
    end
  end

  namespace :admin do
    resources :users
  end

  if ENV["RAILS_SERVE_STATIC_FILES"] == "true"
    get "*path", to: "static#index", constraints: ->(req) { !req.xhr? && req.format.html? }
  end
end
