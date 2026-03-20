class ObjectReferenceReconciler
  ENTITY_TO_TYPE = {
    "document" => "Document",
    "table" => "Table",
    "user" => "User"
  }.freeze

  ENTITY_TO_MODEL = {
    "Document" => Document,
    "Table" => Table,
    "User" => User
  }.freeze

  def self.reconcile(document, version)
    new(document).reconcile(version)
  end

  def self.reconcile_comment(comment)
    new(comment.object).reconcile_comment(comment)
  end

  def initialize(source_object)
    @source_object = source_object
    @organization = source_object.organization
  end

  def reconcile(version)
    content_blocks = version.content_blocks
    mention_nodes = BlocknoteBlocks.extract_references(content_blocks)
    node_ids = mention_nodes.map { |m| m[:id] }

    # Batch-fetch existing targets and their titles
    target_data = batch_fetch_targets(mention_nodes)

    # Batch-fetch existing version-sourced object_references for this source
    existing_mentions = ObjectReference.for_source(@source_object)
                                       .where(source_comment_id: nil)
                                       .index_by(&:source_node_id)

    # Upsert mentions
    mention_nodes.each do |node|
      target_type = ENTITY_TO_TYPE[node[:entity]]
      next unless target_type

      entity_id = node[:entity_id].to_s
      target_info = target_data.dig(target_type, entity_id)
      target_id = target_info ? entity_id : nil

      # Use target's real title if it exists, otherwise use the mention node's title
      title = target_info&.dig(:title) || node[:title].presence || "Untitled"

      if (existing = existing_mentions[node[:id]])
        existing.update!(current: true, title: title, target_id: target_id)
      else
        ObjectReference.create!(
          source_node_id: node[:id],
          source: @source_object,
          target_type: target_type,
          target_id: target_id,
          title: title,
          current: true,
          organization: @organization,
          source_version_id: version.id,
          created_at: version.created_at
        )
      end
    end

    # Mark removed mentions as not current (only version-sourced refs)
    ObjectReference.for_source(@source_object)
                 .where(source_comment_id: nil)
                 .where.not(source_node_id: node_ids)
                 .where(current: true)
                 .update_all(current: false)
  end

  def reconcile_comment(comment)
    reference_nodes = BlocknoteBlocks.extract_references(comment.content)
    node_ids = reference_nodes.map { |m| m[:id] }

    target_data = batch_fetch_targets(reference_nodes)

    existing_refs = ObjectReference.where(source_comment_id: comment.id).index_by(&:source_node_id)

    reference_nodes.each do |node|
      target_type = ENTITY_TO_TYPE[node[:entity]]
      next unless target_type

      entity_id = node[:entity_id].to_s
      target_info = target_data.dig(target_type, entity_id)
      target_id = target_info ? entity_id : nil

      title = target_info&.dig(:title) || node[:title].presence || "Untitled"

      if (existing = existing_refs[node[:id]])
        existing.update!(title: title, target_id: target_id)
      else
        ObjectReference.create!(
          source_node_id: node[:id],
          source: @source_object,
          target_type: target_type,
          target_id: target_id,
          title: title,
          current: true,
          organization: @organization,
          source_comment_id: comment.id,
          created_at: comment.created_at
        )
      end
    end

    # Remove references for mentions no longer in this comment
    ObjectReference.where(source_comment_id: comment.id)
                 .where.not(source_node_id: node_ids)
                 .delete_all
  end

  private

  def batch_fetch_targets(mention_nodes)
    targets = {}

    mention_nodes.group_by { |m| ENTITY_TO_TYPE[m[:entity]] }.each do |target_type, nodes|
      next unless target_type

      model = ENTITY_TO_MODEL[target_type]
      next unless model

      ids = nodes.map { |n| n[:entity_id].to_s }.reject(&:blank?).uniq
      records = model.where(id: ids)

      targets[target_type] = records.each_with_object({}) do |record, h|
        title = case target_type
                when "User" then record.display_name
                else record.title
                end
        h[record.id.to_s] = { title: title }
      end
    end

    targets
  end
end
