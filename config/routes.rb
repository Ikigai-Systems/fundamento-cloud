Rails.application.routes.draw do
  devise_for :users, controllers: {
    registrations: 'users/registrations',
    sessions: "users/sessions",
    invitations: "users/invitations"
  }

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Add in our Websocket route
  mount ActionCable.server => '/cable'

  # Defines the root path route ("/")
  root "root#index"

  defaults export: true do
    resources :documents, only: [:index]

    resources :spaces, only: [:show] do
      resources :documents, only: [:create, :new, :edit, :update]
    end
  end


  resources :organizations do
    member do
      post :select
    end
  end

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
end
