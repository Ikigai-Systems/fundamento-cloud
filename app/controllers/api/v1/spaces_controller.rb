module Api
  module V1
    class SpacesController < Api::ApiController
      def index
        spaces = policy_scope(current_organization.spaces.without_archived).order(:name)
        render json: spaces.map { |space|
          {
            id: space.id,
            name: space.name,
            archived: space.archived,
            created_at: space.created_at,
            updated_at: space.updated_at
          }
        }
      end

      def show
        space = current_organization.spaces.find(params[:id])
        authorize space

        documents = space.documents_from_hierarchy.map { |doc|
          build_document_hierarchy(doc, space)
        }

        render json: {
          id: space.id,
          name: space.name,
          archived: space.archived,
          created_at: space.created_at,
          updated_at: space.updated_at,
          documents: documents
        }
      end

      def create
        space = current_organization.spaces.new(space_params)

        authorize space, :create?

        if space.save
          render json: space_response(space), status: :created
        else
          render json: { errors: space.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def archive
        space = current_organization.spaces.find(params[:id])
        authorize space, :archive?
        space.update!(archived: true)
        render json: space_response(space)
      end

      def unarchive
        space = current_organization.spaces.find(params[:id])
        authorize space, :unarchive?
        space.update!(archived: false)
        render json: space_response(space)
      end

      private

      def space_response(space)
        {
          id: space.id,
          name: space.name,
          access_mode: space.access_mode,
          archived: space.archived,
          created_at: space.created_at,
          updated_at: space.updated_at
        }
      end

      def space_params
        params.require(:space).permit(:name, :access_mode)
      end

      def build_document_hierarchy(doc, space)
        node = {
          npi: doc.id,
          title: doc.title
        }

        hierarchy_node = find_in_hierarchy(space.hierarchy, doc.id)
        if hierarchy_node && hierarchy_node["children"]
          children_docs = hierarchy_node["children"].map do |child_node|
            child_doc = space.documents.find_by(id: child_node["id"])
            build_document_hierarchy(child_doc, space) if child_doc
          end.compact

          node[:children] = children_docs if children_docs.any?
        end

        node
      end

      def find_in_hierarchy(hierarchy, npi, current_node = nil)
        hierarchy.each do |node|
          return node if node["id"] == npi

          if node["children"]
            found = find_in_hierarchy(node["children"], npi, node)
            return found if found
          end
        end

        nil
      end
    end
  end
end
