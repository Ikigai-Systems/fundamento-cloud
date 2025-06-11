class OnboardingContentsController < ApplicationController
  include EnsureOrganization

  def show
    send_file Rails.root.join("app", "templates", "space_onboarding_content", request.path["/onboarding_contents/".length..]), :disposition => 'inline'
  end
end
