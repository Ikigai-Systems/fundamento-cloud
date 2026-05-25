module Api
  module V1
    class SpacesController < Api::ApiController
      include LoadSpace.from_param(:id)

      before_action :load_space, only: [:show, :archive, :unarchive]

      def index
        spaces = policy_scope(current_organization.spaces.without_archived).order(:name)
        render json: SpaceBlueprint.render(spaces)
      end

      def show
        authorize @space

        render json: SpaceBlueprint.render(@space, view: :with_documents)
      end

      def create
        space = current_organization.spaces.new(space_params)

        authorize space, :create?

        if space.save
          render json: SpaceBlueprint.render(space), status: :created
        else
          render json: { errors: space.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def archive
        authorize @space, :archive?

        @space.update!(archived: true)

        render json: SpaceBlueprint.render(@space)
      end

      def unarchive
        authorize @space, :unarchive?

        @space.update!(archived: false)

        render json: SpaceBlueprint.render(@space)
      end

      private

      def space_params
        params.require(:space).permit(:name, :access_mode)
      end
    end
  end
end
