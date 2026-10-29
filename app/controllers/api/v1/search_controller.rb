module Api
  module V1
    class SearchController < Api::ApiController
      rescue_from ArgumentError do |error|
        render json: { error: error.message }, status: :unprocessable_entity
      end

      rescue_from ActiveRecord::RecordNotFound do
        head :not_found
      end

      def show
        render json: ObjectSearch.call(pundit_user:, **search_params)
      end

      private

      def search_params
        params.permit(:query, :space_id, :updated_after, :updated_before, :limit, :offset, object_types: [], tags: [])
          .to_h.symbolize_keys
      end
    end
  end
end
