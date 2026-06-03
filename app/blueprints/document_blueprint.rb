class DocumentBlueprint < Blueprinter::Base
  identifier :id

  fields :title, :created_at, :updated_at

  view :mcp do
    field :content do |document|
      if document.draft?
        BlocknoteConverterService.blocks_to_markdown(document.to_blocks)
      else
        BlocknoteConverterService.blocks_to_markdown(document.versions.last.content_blocks)
      end
    end

    field :tags do |document|
      document.tags.map do |tag|
        "\##{tag.name}"
      end
    end
  end
end