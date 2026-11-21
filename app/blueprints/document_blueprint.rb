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
  # `block_ids: true` to end every block with its " ^id" marker (off here; the Read Document tool
  # turns it on). The blocks that have comments get theirs either way, so a client that sends the
  # document back does not lose the comments.
  #
  # `source: :live` reads the live content instead of the latest saved version (a draft reads live
  # either way); `source` in the result says which one it was. `sync_version` says which state of
  # the content it is, for a client to send back when it updates, so it comes only with live
  # content: next to a saved version it would vouch for edits the client never saw.
  view :mcp do
    include_view :tagged

    field :sync_version, exclude_if_nil: true do |document, options|
      document.sync_version if options[:source] == :live || document.draft?
    end

    field :source do |document, options|
      (options[:source] == :live || document.draft?) ? "live" : "saved_version"
    end

    field :content do |document, options|
      block_ids = (options[:block_ids] == true) ? :all : document.commented_block_ids
      markers = block_ids.present? ? {block_ids: block_ids} : {}
      markdown = BlocknoteConverterService.blocks_to_markdown(document.blocks_from(options[:source]), **markers)
      options[:frontmatter] == true ? document.to_frontmatter + markdown : markdown
    end
  end
end
