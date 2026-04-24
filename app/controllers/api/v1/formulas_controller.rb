# frozen_string_literal: true

module Api
  module V1
    class FormulasController < Api::ApiController
      def eval
        space = nil
        if params[:space_id].present?
          space = current_organization.spaces.find_by_param!(params[:space_id])
          authorize space, :show?
        end

        result = FormulaService.evaluate(
          params[:formula],
          space,
          current_organization_membership,
          additional_context: {}
        )

        render json: result
      end
    end
  end
end
