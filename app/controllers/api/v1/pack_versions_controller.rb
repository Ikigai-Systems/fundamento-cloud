module Api::V1
  class PackVersionsController < Api::ApiController
    before_action :load_pack

    def create
      @pack_version = @pack.versions.create!(
        organization_id: @pack.organization_id
      )

      render json: @pack_version
    end

    # FIXME: it's broken
    def update
      @pack_version = @pack.versions.find_by_version!(params[:id])

      if @pack_version.update(params.require(:bundle))
        render json: @pack_version
      else
        render json: @pack_version.errors, status: :unprocessable_entity
      end
    end

    private

    def load_pack
      @pack = Pack.find_by_npi!(params[:pack_npi])
    end
  end
end