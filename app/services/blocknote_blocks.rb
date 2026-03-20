class BlocknoteBlocks
  def self.walk_blocks(nodes, &block)
    return unless nodes.is_a?(Array)

    nodes.each do |node|
      next unless node.is_a?(Hash)

      yield node

      walk_blocks(node["content"], &block) if node["content"].is_a?(Array)
      walk_blocks(node["children"], &block) if node["children"].is_a?(Array)
    end
  end

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
