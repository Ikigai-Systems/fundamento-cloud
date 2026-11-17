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

  # Content as Markdown. Pass `frontmatter: true` to prefix it with a YAML frontmatter block, and
  # `block_ids: true` to end every block with its " ^id" marker. The blocks that have comments get
  # theirs either way, so a client that sends the document back does not lose the comments.
  view :mcp do
    include_view :tagged

    field :content do |document, options|
      block_ids = (options[:block_ids] == true) ? :all : document.commented_block_ids
      markers = block_ids.present? ? {block_ids: block_ids} : {}
      markdown = BlocknoteConverterService.blocks_to_markdown(document.current_blocks, **markers)
      options[:frontmatter] == true ? document.to_frontmatter + markdown : markdown
    end
  end
end
