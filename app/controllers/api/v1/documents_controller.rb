module Api
  module V1
    class DocumentsController < Api::ApiController
      def index
        space = current_organization.spaces.find_by_param!(params[:space_id])
        authorize space

        documents = policy_scope(space.documents).order(:title)

        render json: DocumentBlueprint.render(documents)
      end

      def create
        if document_params[:file].nil? && document_params[:markdown].nil?
          render json: { errors: { base: "Either file or markdown must be present" } }, status: :unprocessable_entity
          return
        end

        document = if document_params[:file].present?
          DocumentService.new(pundit_user: pundit_user).
            create_from_file!(
              space_id: params[:space_id],
              title: document_params[:title],
              icon: document_params[:icon],
              color: document_params[:color],
              parent_document_id: document_params[:parent_document_id],
              file: document_params[:file],
            )
        else
          DocumentService.new(pundit_user: pundit_user).
            create!(
              space_id: params[:space_id],
              title: document_params[:title],
              icon: document_params[:icon],
              color: document_params[:color],
              parent_document_id: document_params[:parent_document_id],
              markdown: document_params[:markdown],
            )
        end

        render json: DocumentBlueprint.render(document), status: :created
      rescue BlocknoteConverterService::ConversionError
        render json: { errors: { markdown: "Conversion failed" } }, status: :unprocessable_entity
      rescue PandocConverterService::ConversionError => e
        render json: { errors: { file: e.message } }, status: :unprocessable_entity
      rescue ArgumentError => e
        render json: { errors: { base: e.message } }, status: :unprocessable_entity
      rescue ActiveRecord::RecordInvalid => invalid
        render json: { errors: invalid.record.errors.full_messages }, status: :unprocessable_entity
      end

      def show
        document = current_organization.documents.find(params[:id])
        authorize document

        blocks = if document.draft?
          document.to_blocks
        else
          document.versions.last.content_blocks
        end

        respond_to do |format|
          format.json do
            render json: DocumentBlueprint.render_as_hash(document).merge(
              content: blocks,
              tags: document.tags.map { |tag| "##{tag.name}" }
            )
          end

          format.md do
            # Opt in with exactly `frontmatter=true`; any other value leaves the output as it was.
            frontmatter = params[:frontmatter] == "true" ? DocumentService.new(pundit_user: pundit_user).build_frontmatter(document) : ""
            render locals: { content: BlocknoteConverterService.blocks_to_markdown(blocks), frontmatter: frontmatter }
          end
        end
      end

      def update
        begin
          document = DocumentService.new(pundit_user: pundit_user).
            update!(
              document_id: params[:id],
              markdown: document_params[:markdown],
              title: document_params[:title],
              icon: document_params[:icon],
              color: document_params[:color]
            )

          render json: DocumentBlueprint.render(document)
        rescue BlocknoteConverterService::ConversionError
          render json: { errors: { markdown: "Conversion failed" } }, status: :unprocessable_entity
        rescue ArgumentError => e
          render json: { errors: { base: e.message } }, status: :unprocessable_entity
        rescue ActiveRecord::RecordInvalid => invalid
          render json: { errors: invalid.record.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def document_params
        params.require(:document).permit(:title, :icon, :color, :markdown, :parent_document_id, :file)
      end
    end
  end
end
