class Construction::ConstructionController < ActionController::Base
  before_action :authenticate_superintendent!
end