# db/seeds/setup/documents.rb
# Helpers for creating documents from markdown files.
# Converts markdown -> BlockNote blocks -> YJS binary via BlocknoteConverterService.

section :document_helpers do
  # Derive a title from a markdown filename
  # "greenleaf-gtm-strategy.md" -> "Greenleaf Gtm Strategy"
  def documents.title_from_filename(path)
    File.basename(path, ".md").tr("-", " ").split.map(&:capitalize).join(" ")
  end

  # Resolve PLACEHOLDER_* tokens in BlockNote blocks with actual NPIs.
  # table_placeholders: { "campaign_tracker" => <Table record>, ... }
  # Replaces PLACEHOLDER_campaign_tracker with the table's NPI.
  # Also resolves column placeholders: PLACEHOLDER_<column_name_snake> with column NPI.
  def documents.resolve_placeholders!(blocks, table_placeholders)
    return blocks if table_placeholders.empty?

    json_str = blocks.to_json

    table_placeholders.each do |placeholder_key, table|
      # Replace table NPI placeholder
      json_str.gsub!("PLACEHOLDER_#{placeholder_key}", table.id)

      # Replace column NPI placeholders
      table.columns.each do |col|
        col_key = col.name.downcase.gsub(/\s+/, "_")
        json_str.gsub!("PLACEHOLDER_#{col_key}", col.id)
      end
    end

    JSON.parse(json_str)
  end

  # Resolve user mention email placeholders in BlockNote blocks with actual user IDs.
  # Uses BlocknoteBlocks.each_mention to walk the block tree looking for user mention
  # nodes whose entityId contains an email address, then replaces with actual user NPI IDs.
  def documents.resolve_user_mentions!(blocks, organization)
    # First pass: collect email entityIds from user mention nodes
    emails = []
    BlocknoteBlocks.each_mention(blocks) do |node|
      props = node["props"] || {}
      next unless props["entity"] == "user"
      entity_id = props["entityId"].to_s
      emails << entity_id if entity_id.include?("@")
    end
    emails.uniq!

    return blocks if emails.empty?

    users_by_email = User.joins(:organization_memberships)
                         .where(organization_memberships: { organization: organization })
                         .where(email: emails)
                         .index_by(&:email)

    unresolved = emails - users_by_email.keys
    unresolved.each { |email| puts "  [Warning] User mention not resolved: #{email}" }

    # Second pass: replace email entityIds with user NPI IDs in-place
    BlocknoteBlocks.each_mention(blocks) do |node|
      props = node["props"] || {}
      next unless props["entity"] == "user"
      entity_id = props["entityId"].to_s
      if (user = users_by_email[entity_id])
        props["entityId"] = user.id
      end
    end

    blocks
  end

  # Create a document from a markdown file, converting to BlockNote/YJS.
  #
  # Options:
  #   markdown_path: - absolute path to the .md file
  #   space: - the Space record
  #   organization: - the Organization record
  #   author: - (optional) User who created it
  #   table_placeholders: - (optional) hash of { "name" => Table } for NPI resolution
  #   title: - (optional) override title, otherwise derived from filename
  #   parent_document_id: - (optional) parent doc ID for nesting in hierarchy
  def documents.create_from_markdown(label = nil, markdown_path:, space:, organization:, author: nil, table_placeholders: {}, parent_document_id: nil, **attrs)
    markdown = File.read(markdown_path)
    blocks = BlocknoteConverterService.markdown_to_blocks(markdown)

    # Resolve table/column NPI placeholders if any tables are referenced
    blocks = resolve_placeholders!(blocks, table_placeholders) if table_placeholders.any?

    # Resolve user mention email placeholders to actual user IDs
    blocks = resolve_user_mentions!(blocks, organization)

    yjs_binary = BlocknoteConverterService.blocks_to_yjs(blocks)

    title = attrs.delete(:title) || title_from_filename(markdown_path)

    doc = create(label,
      title: title,
      sync: yjs_binary,
      space: space,
      organization: organization,
      **attrs
    )

    Version.create!(
      document: doc,
      content_blocks: blocks,
      created_by: author
    )

    # Add to space hierarchy
    if parent_document_id
      node = space.create_hierarchy_node(doc.id)
      space.add_item_to_hierarchy!(space.hierarchy, parent_document_id, node)
    else
      space.hierarchy.append(space.create_hierarchy_node(doc.id))
    end
    space.save!

    puts "  [Document] #{title}"
    doc
  end
end
