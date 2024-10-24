module Api::V1
  class PacksController < Api::ApiController
    def index
      render json: []
    end
    
    def next_version
      @pack = Pack.find_by_npi!(params[:npi])
      # @pack.versions.create!(version: @pack.versions.maximum(:version).to_i + 1)

      render json: @pack
    end
  end
end