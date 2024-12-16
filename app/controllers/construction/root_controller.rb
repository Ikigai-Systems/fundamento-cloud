class Construction::RootController < Construction::ConstructionController
  def index
    redirect_to "/construction/jobs"
  end
end
