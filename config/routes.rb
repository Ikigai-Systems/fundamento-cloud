Rails.application.routes.draw do
  devise_for :users, controllers: {
    registrations: 'users/registrations',
    passwords: 'users/passwords',
    sessions: "users/sessions"
  }

  devise_for :invited_users, controllers: {
    invitations: "invited_users/invitations"
  }

  # Add in our Websocket route
  mount ActionCable.server => '/cable'

  # Add GoodJob's dashboard - https://github.com/bensheldon/good_job?tab=readme-ov-file#dashboard
  if Rails.env.development?
    mount GoodJob::Engine => "/jobs"
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  root "root#index"

  # We use `defaults export: true` here to export routes to app/javascript/api,
  # to learn more visit https://github.com/ElMassimo/js_from_routes?tab=readme-ov-file#specify-the-routes-you-want
  defaults export: true do
    resources :documents, only: [:index, :show, :update]

    resources :spaces, param: :npi do
      put :reorder_hierarchy, to: "spaces#reorder_hierarchy"

      get :suggest_owners, on: :collection

      member do
        get :sidebar
      end

      resources :documents, only: [:create, :new, :show, :edit, :update, :destroy] do
        resources :versions, module: :documents, only: [:create, :index, :show]

        member do
          get :select_destination
          post :move
        end
      end

      resources :tables, module: :tables, only: [:new, :create, :show, :edit, :update, :destroy, :index] do
        put :update_by_rowstack, on: :member
        post :preview_formula, on: :member
        post :move_column_left, on: :member
        post :move_column_right, on: :member
      end

      resources :automations, param: :npi
    end

    resources :attachments, only: [:create, :destroy, :show]

    resources :users, only: [:index, :show] do
      get :suggestions, on: :collection

      resources :api_tokens, only: [:index, :new, :create, :destroy]
    end

    resources :tables, module: :tables, only: [:show] do
      resources :columns

      resources :rows do
        resources :cells
      end
    end

    resources :public_links

    get "/public/:npi" => "public#show"
    get "/public/attachments/:id" => "public#attachment"

    post '/formulas/eval', to: "formulas#eval"
  end

  namespace :tables_no_auth do
    resources :tables, only: [:show]
  end

  resources :organizations, param: :npi do
    member do
      post :select
    end
  end

  resources :organizations_users, param: :npi, only: [:destroy] do
    member do
      patch :promote
      patch :demote
    end
  end

  resources :favorites, param: :npi, only: [:create, :destroy, :index]

  resources :teams, param: :npi do
    get :suggest_members, on: :collection
  end

  resources :packs, param: :npi do
    # get :suggest_members, on: :collection
  end

  # Redirect /api/v1/attachments/:id to AttachmentsController#show
  get '/api/v1/attachments/:id', to: 'attachments#show'

  namespace :api, defaults: { format: :json } do
    namespace :v1 do
      resources :packs, param: :npi do
        member do
          post :next_version
        end

        resources :versions, controller: "pack_versions", param: :version do
          member do
            post :register
          end
        end
      end

      resources :automations, param: :npi, only: [] do
        resources :invocations, controller: "automation_invocations", only: [:create]
      end
    end
  end
end
