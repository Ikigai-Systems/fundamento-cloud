module Api
  module V1
    class SpacesController < Api::ApiController
      def index
        spaces = policy_scope(current_organization.spaces).order(:name)
        render json: spaces.map { |space|
          {
            npi: space.npi,
            name: space.name,
            created_at: space.created_at,
            updated_at: space.updated_at
          }
        }
      end

      def show
        space = current_organization.spaces.find_by_param!(params[:npi])
        authorize space

        documents = space.documents_from_hierarchy.map { |doc|
          build_document_hierarchy(doc, space)
        }

        render json: {
          npi: space.npi,
          name: space.name,
          created_at: space.created_at,
          updated_at: space.updated_at,
          documents: documents
        }
      end

      def create
        space = current_organization.spaces.new(space_params)

        authorize space, :create?

        if space.save
          render json: {
            npi: space.npi,
            name: space.name,
            access_mode: space.access_mode,
            created_at: space.created_at,
            updated_at: space.updated_at
          }, status: :created
        else
          render json: { errors: space.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def space_params
        params.require(:space).permit(:name, :access_mode)
      end

      def build_document_hierarchy(doc, space)
        node = {
          npi: doc.npi,
          title: doc.title
        }

        # Find children from hierarchy
        hierarchy_node = find_in_hierarchy(space.hierarchy, doc.npi)
        if hierarchy_node && hierarchy_node['children']
          children_docs = hierarchy_node['children'].map do |child_node|
            child_doc = space.documents.find_by(npi: child_node['id'])
            build_document_hierarchy(child_doc, space) if child_doc
          end.compact

          node[:children] = children_docs if children_docs.any?
        end

        node
      end

      def find_in_hierarchy(hierarchy, npi, current_node = nil)
        hierarchy.each do |node|
          return node if node['id'] == npi

          if node['children']
            found = find_in_hierarchy(node['children'], npi, node)
            return found if found
          end
        end

        nil
      end
    end
  end
end
