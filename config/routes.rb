Rails.application.routes.draw do
  devise_for :superintendent

  devise_for :users, controllers: {
    registrations: "users/registrations",
    confirmations: "users/confirmations",
    passwords: "users/passwords",
    sessions: "users/sessions"
  }

  devise_scope :user do
    get "/users/confirmation/pending" => "users/confirmations#pending", as: :users_confirmation_pending
  end

  devise_for :invited_users, controllers: {
    invitations: "invited_users/invitations"
  }

  # Add in our Websocket route
  mount ActionCable.server => "/cable"

  # Add GoodJob's dashboard - https://github.com/bensheldon/good_job?tab=readme-ov-file#dashboard
  authenticate :superintendent do
    mount GoodJob::Engine => "/construction/jobs"
  end

  authenticate :superintendent do
    mount Flipper::Api.app(Flipper) => "/construction/flipper/api"
    mount Flipper::UI.app(Flipper) => "/construction/flipper"
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # authenticated :superintendent do
  #   root "construction/root#index", as: :construction_root
  # end

  # PostHog analytics proxy
  match "/ingest/*path", to: "analytics/ingest#proxy", via: [:get, :post]

  root "root#index"

  get "/recently_updated" => "root#recently_updated", as: :recently_updated
  get "/notifications" => "root#notifications", as: :notifications
  get "/shared" => "root#shared", as: :shared

  get "/sign_up_with_google" => "users/sign_up_with_google#sign_up_with_google", as: :sign_up_with_google

  # We use `defaults export: true` here to export routes to app/javascript/api,
  # to learn more visit https://github.com/ElMassimo/js_from_routes?tab=readme-ov-file#specify-the-routes-you-want
  defaults export: true do
    resources :spaces, path: "s" do
      get :suggest_owners, on: :collection

      member do
        put :reorder_hierarchy, to: "spaces#reorder_hierarchy"
        get :sidebar
      end

      resources :automations
      resources :tags, only: [] do
        get :suggest, on: :collection
      end
    end

    resources :documents, path: "d" do
      resources :versions, module: :documents, only: [:create, :index, :show, :update]
      resources :tags, module: :objects, only: [:create, :index]

      member do
        get :select_destination
        post :move

        get :hierarchy
        get :sidebar
      end
    end

    resources :tables, path: "t", module: :tables do
      resources :columns
      resources :rows do
        resources :cells
      end

      member do
        put :update_by_rowstack
        post :preview_formula
        post :move_column_left
        post :move_column_right

        get :sidebar
      end
    end

    # Workaround to use Objects::TagsController, instead of Tables::Objects::TagsController
    resources :tables, path: "t", only: [] do
      resources :tags, module: :objects, only: [:create, :index]
    end

    resources :attachments, only: [:create, :destroy, :show]

    get "/onboarding_contents/*path" => "onboarding_contents#show"

    resources :users, only: [:index, :show] do
      get :suggestions, on: :collection

      resources :api_tokens, only: [:index, :new, :create, :destroy]

      resources :user_properties, only: [:update], module: :users

      resource :avatar, only: [:edit, :update, :destroy], module: :users
    end

    resources :public_links do
      resources :allowed_emails, only: [:create, :destroy], param: :email, constraints: { email: /[^\/]+/ }
    end

    resources :reactions, only: [:create, :index, :show, :destroy]
    resources :comments

    post "/inline_comments/threads" => "inline_comments#add_comment_thread"
    delete "inline_comments/threads/:thread_id" => "inline_comments#remove_comment_thread"
    post "/inline_comments/threads/:thread_id/resolve" => "inline_comments#resolve_comment_thread"
    post "/inline_comments/threads/:thread_id/reopen" => "inline_comments#reopen_comment_thread"

    get "/inline_comments/threads/:thread_id" => "inline_comments#get_comment_thread"
    post "/inline_comments/threads/:thread_id/comments" => "inline_comments#add_comment"
    put "/inline_comments/threads/:thread_id/comments/:comment_id" => "inline_comments#update_comment"
    delete "/inline_comments/threads/:thread_id/comments/:comment_id" => "inline_comments#remove_comment"

    get "/public/:id" => "public#show", as: :public
    get "/public/attachments/:id" => "public#attachment"

    post "/formulas/eval", to: "formulas#eval"

    resource :search, only: [:show]
  end

  resources :organizations do
    member do
      post :select
    end
  end

  resources :organization_memberships, only: [:new, :create, :update, :destroy] do
    member do
      patch :promote
      patch :demote
      get :change_password
    end
  end

  resources :favorites, only: [:create, :destroy, :index]

  resources :mentions, only: [:index]

  resources :teams do
    get :suggest_members, on: :collection
  end

  resources :packs do
    # get :suggest_members, on: :collection
  end

  # Redirect /api/v1/attachments/:id to AttachmentsController#show
  get "/api/v1/attachments/:id", to: "attachments#show"

  # TODO: remove those after some time
  get "/spaces/:space_id/documents/:id", to: "documents#show"
  get "/spaces/:space_id/documents/:id/edit", to: "documents#edit"
  get "/spaces/:space_id/tables/:id", to: "tables/tables#show"
  get "/spaces/:space_id/tables/:id/edit", to: "tables/tables#edit"

  namespace :api, defaults: { format: :json } do
    resource :mcp, only: [:create, :show], controller: :mcp

    namespace :v1 do
      resources :packs do
        member do
          post :next_version
        end

        resources :versions, controller: "pack_versions", param: :version do
          member do
            post :register
          end
        end
      end

      resources :automations, only: [] do
        resources :invocations, controller: "automation_invocations", only: [:create]
      end

      resources :spaces, only: [:index, :show, :create]

      resources :documents, only: [:index, :show, :create, :update] do
        resources :object_mentions, only: [:index]
      end

      resources :tables, only: [:show]

      resources :users, only: [:show]

      resources :import_sessions, only: [:create, :show, :destroy] do
        member do
          post :manifest
          post :process, action: :trigger_processing
          post :retry, action: :retry_failed
        end
        resources :import_files, only: [:update]
      end
    end
  end

  resources :import_sessions, only: [:index, :show, :new, :create] do
    member do
      post :manifest
      post :process, action: :trigger_processing
    end
    resources :import_files, only: [:update]
  end
end
