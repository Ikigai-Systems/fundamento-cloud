class DocumentBlueprint < Blueprinter::Base
  identifier :npi

  fields :title, :created_at, :updated_at

  view :mcp do
    field :content do |document|
      if document.versions.empty?
        document.to_blocks
      else
        document.versions.last.content_blocks
      end
    end

    field :tags do |document|
      document.tags.map do |tag|
        "\##{tag.name}"
      end
    end
  end
end