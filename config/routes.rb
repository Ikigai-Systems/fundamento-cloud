Rails.application.routes.draw do
  devise_for :superintendent

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
  authenticate :superintendent do
    mount GoodJob::Engine => "/construction/jobs"
  end

  authenticate :superintendent do
    mount Flipper::UI.app(Flipper) => "/construction/flipper"
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # authenticated :superintendent do
  #   root "construction/root#index", as: :construction_root
  # end

  root "root#index"

  # We use `defaults export: true` here to export routes to app/javascript/api,
  # to learn more visit https://github.com/ElMassimo/js_from_routes?tab=readme-ov-file#specify-the-routes-you-want
  defaults export: true do
    resources :spaces, path: "s", param: :npi do
      put :reorder_hierarchy, to: "spaces#reorder_hierarchy"

      get :suggest_owners, on: :collection

      member do
        get :sidebar
      end

      resources :automations, param: :npi
    end

    resources :documents, path: "d", param: :npi do
      resources :versions, module: :documents, only: [:create, :index, :show]
      resources :reactions, module: :documents, only: [:create, :index, :show, :destroy]

      member do
        get :select_destination
        post :move

        get :hierarchy
        get :sidebar
      end
    end

    resources :tables, path: "t", param: :npi, module: :tables do
      resources :columns
      resources :rows do
        resources :cells
      end
      resources :reactions, only: [:create, :index, :show, :destroy]

      member do
        put :update_by_rowstack
        post :preview_formula
        post :move_column_left
        post :move_column_right
      end
    end

    resources :attachments, only: [:create, :destroy, :show]

    resources :users, only: [:index, :show] do
      get :suggestions, on: :collection

      resources :api_tokens, only: [:index, :new, :create, :destroy]
    end

    resources :public_links

    get "/public/:npi" => "public#show"
    get "/public/attachments/:id" => "public#attachment"

    post '/formulas/eval', to: "formulas#eval"
  end

  resources :organizations, param: :npi do
    member do
      post :select
    end
  end

  resources :organization_users, param: :npi, only: [:new, :create, :update, :destroy] do
    member do
      patch :promote
      patch :demote
      get :change_password
    end
  end

  resources :favorites, param: :npi, only: [:create, :destroy, :index]

  resources :mentions, param: :npi, only: [:index]

  resources :teams, param: :npi do
    get :suggest_members, on: :collection
  end

  resources :packs, param: :npi do
    # get :suggest_members, on: :collection
  end

  # Redirect /api/v1/attachments/:id to AttachmentsController#show
  get '/api/v1/attachments/:id', to: 'attachments#show'

  # TODO: remove those after some time
  get "/spaces/:space_npi/documents/:npi", to: "documents#show"
  get "/spaces/:space_npi/documents/:npi/edit", to: "documents#edit"
  get "/spaces/:space_npi/tables/:npi", to: "tables/tables#show"
  get "/spaces/:space_npi/tables/:npi/edit", to: "tables/tables#edit"

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

      resources :tables, only: [:show]
    end
  end
end
