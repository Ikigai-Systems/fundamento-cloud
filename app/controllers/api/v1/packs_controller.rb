module Api::V1
  class PacksController < Api::ApiController
    def index
      render json: []
    end
    
    def next_version
      @pack = Pack.find(params[:id])
      # @pack.versions.create!(version: @pack.versions.maximum(:version).to_i + 1)

      render json: @pack
    end
  end
end