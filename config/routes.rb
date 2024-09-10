Rails.application.routes.draw do
  devise_for :users, controllers: {
    registrations: 'users/registrations',
    passwords: 'users/passwords',
    sessions: "users/sessions"
  }

  devise_for :invited_users, controllers: {
    invitations: "invited_users/invitations"
  }

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Add in our Websocket route
  mount ActionCable.server => '/cable'

  # Defines the root path route ("/")
  root "root#index"

  # We use `defaults export: true` here to export routes to app/javascript/api,
  # to learn more visit https://github.com/ElMassimo/js_from_routes?tab=readme-ov-file#specify-the-routes-you-want
  defaults export: true do
    resources :documents, only: [:index, :show]

    resources :spaces, param: :npi do
      put :reorder_hierarchy, to: "spaces#reorder_hierarchy"
      resources :documents, only: [:create, :new, :edit, :update, :destroy] do
        resources :versions, only: [:create]
      end
    end

    resources :attachments, only: [:create, :destroy, :show]

    resources :users, only: [:index, :show] do
      get :suggestions, on: :collection
    end

    resources :tables, module: :tables do
      resources :columns

      resources :rows do
        resources :cells
      end
    end

    resources :public_links
  end


  resources :organizations do
    member do
      post :select
    end
  end

  resources :organizations_users, only: [:destroy]

  resources :teams, param: :npi
  resources :team_memberships, only: [:new, :create, :destroy]

  namespace :admin do
    resources :users
  end

  get "/public/:npi" => "public#show"

  # Redirect /api/v1/attachments/:id to AttachmentsController#show
  get '/api/v1/attachments/:id', to: 'attachments#show'
end
