class DocumentBlueprint < Blueprinter::Base
  identifier :id

  fields :title, :created_at, :updated_at

  field(:icon) { |document| document.icon&.as_json }
  field :color

  view :tagged do
    field :tags do |document|
      document.tags.map do |tag|
        "\##{tag.name}"
      end
    end
  end

  # Content as BlockNote blocks.
  view :api do
    include_view :tagged

    field :content do |document|
      document.current_blocks
    end
  end

  # Content as Markdown. Pass `frontmatter: true` to prefix it with a YAML frontmatter block.
  view :mcp do
    include_view :tagged

    field :content do |document, options|
      markdown = BlocknoteConverterService.blocks_to_markdown(document.current_blocks)
      options[:frontmatter] == true ? document.to_frontmatter + markdown : markdown
    end
  end
end
