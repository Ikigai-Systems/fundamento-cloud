class BlocknoteBlocks
  def self.walk_blocks(nodes, &block)
    return unless nodes.is_a?(Array)

    nodes.each do |node|
      next unless node.is_a?(Hash)

      yield node

      content = node["content"]
      if content.is_a?(Array)
        walk_blocks(content, &block)
      elsif content.is_a?(Hash) && content["type"] == "tableContent"
        walk_table_content(content, &block)
      end
      walk_blocks(node["children"], &block) if node["children"].is_a?(Array)
    end
  end

  # Table blocks store content as { type: "tableContent", rows: [{ cells: [...] }] }.
  # A cell is either a { type: "tableCell", content: [...] } object or, in content saved
  # before BlockNote 0.25, the inline content array itself. TableContent still declares
  # both (`cells: InlineContent[][] | TableCell[]`) and @blocknote/core normalises them
  # in `mapTableCell` / `isTableCell` (src/util/table.ts), which treat anything that is
  # not a "tableCell" object as the cell content. Stored versions are never rewritten, so
  # both shapes reach this walker — assuming a Hash raised TypeError on the older one.
  def self.walk_table_content(content, &block)
    rows = content["rows"]
    return unless rows.is_a?(Array)

    rows.each do |row|
      next unless row.is_a?(Hash)

      cells = row["cells"]
      next unless cells.is_a?(Array)

      cells.each do |cell|
        if cell.is_a?(Hash) && cell["type"] == "tableCell"
          walk_blocks(cell["content"], &block)
        else
          # `mapTableCell` wraps a non-cell in `[].concat(cell)`, so a lone node counts
          # as the cell's content too. Non-hashes fall out in walk_blocks.
          walk_blocks(cell.is_a?(Array) ? cell : [cell], &block)
        end
      end
    end
  end
  private_class_method :walk_table_content

  def self.each_mention(blocks, &block)
    walk_blocks(blocks) do |node|
      yield node if node["type"] == "mention"
    end
  end

  def self.extract_references(blocks)
    references = []
    walk_blocks(blocks) do |node|
      next unless node.is_a?(Hash)

      if node["type"] == "mention"
        props = node["props"] || {}
        id = props["id"].to_s
        entity_id = props["entityId"]

        next if id.blank?
        next if entity_id == -1 || entity_id == "-1"

        references << {
          id: id,
          entity: props["entity"].to_s,
          entity_id: entity_id,
          title: props["title"].to_s
        }
      elsif node["type"] == "advancedTable"
        props = node["props"] || {}
        id = node["id"].to_s
        entity_id = props["tableNpi"].presence || props["tableId"].presence

        next if id.blank?
        next if entity_id.blank?

        references << {
          id: id,
          entity: "table",
          entity_id: entity_id,
          title: ""
        }
      end
    end
    references
  end
end
