# Repairs Obsidian [[wiki links]] that the importer left as literal text.
#
# Obsidian writes two forms for the same file, usually adjacent:
#
#   [[photo.png|Open: photo.png]]   a *link* to the file (the "Open:" alias is generated
#                                   by a plugin and carries no information)
#   ![[photo.png]]                  an *embed* that displays it
#
# Only the embed was ever resolved against the import session's path_map, so the link
# survived as raw text -- and a file uploaded by a *different* import session is absent
# from this session's map, which is why some embeds are dead too. This resolves against
# the attachments table instead, so cross-session references work.
#
# Read-only unless `apply: true`. Reports what it would do either way, which is the
# measurement: it parses the block tree rather than pattern-matching serialized JSON.
class WikiLinkRepair
  # A wiki link, capturing the preceding character so an embed ![[x]] can be told from a
  # link [[x]] -- the two need opposite treatment.
  WIKI = /(?<prefix>.?)\[\[(?<target>[^\]|]+)(?:\|(?<alias>[^\]]*))?\]\]/

  Outcome = Struct.new(:deleted, :flattened, :resolved, :skipped_no_attachment,
                       :skipped_not_a_file, :embeds_left, keyword_init: true) do
    def self.zero
      new(deleted: 0, flattened: 0, resolved: 0, skipped_no_attachment: 0,
          skipped_not_a_file: 0, embeds_left: 0)
    end

    def add(other)
      each_pair { |k, v| self[k] = v + other[k] }
      self
    end

    def touched? = deleted.positive? || flattened.positive? || resolved.positive?
  end

  attr_reader :outcome, :samples

  def initialize(apply: false, limit: nil, space_id: nil, document_id: nil, logger: nil)
    @apply       = apply
    @limit       = limit
    @space_id    = space_id
    @document_id = document_id
    @logger      = logger || Rails.logger
    @outcome     = Outcome.zero
    @samples     = []
    @changed     = 0
    @failed      = 0
  end

  def run
    scope.find_each do |document|
      break if @limit && @changed >= @limit

      repair_document(document)
    rescue StandardError => e
      @failed += 1
      @logger.error "WikiLinkRepair: #{document.id} failed: #{e.class}: #{e.message}"
    end

    report
  end

  private

  def scope
    documents = Document.joins(:content).where.not(object_contents: {sync: nil})
    documents = documents.where(space_id: @space_id) if @space_id
    return documents.where(id: @document_id) if @document_id

    # Decoding a Y.js body costs a Node subprocess per document, so narrow to documents
    # whose latest saved version still shows a "[[" before paying that. A document edited
    # since its last save could in principle carry one only in sync; for imported
    # documents the two agree, and --document bypasses this filter entirely.
    documents.where(id: candidate_ids)
  end

  def candidate_ids
    ActiveRecord::Base.connection.select_values(<<~SQL)
      SELECT document_id FROM (
        SELECT DISTINCT ON (document_id) document_id, content_blocks::text AS body
        FROM versions ORDER BY document_id, sequential_id DESC
      ) t WHERE t.body LIKE '%[[%'
    SQL
  end

  def repair_document(document)
    blocks = BlocknoteConverterService.yjs_to_blocks(document.content.sync)
    return if blocks.blank?
    return unless blocks.to_json.include?("[[")

    index, by_id = attachment_index(document)
    embedded     = embedded_filenames(blocks, by_id)
    before   = @outcome.dup

    rewritten = rewrite_blocks(blocks, document, index, embedded)
    delta     = Outcome.zero.add(@outcome).tap { |d| d.each_pair { |k, v| d[k] = v - before[k] } }
    return unless delta.touched?

    @changed += 1
    return unless @apply

    new_sync = BlocknoteConverterService.blocks_to_yjs(rewritten)
    Document.transaction do
      document.versions.create!(content_blocks: rewritten, created_by: repair_author(document))
      document.content.update!(sync: new_sync)
    end
  end

  # One attachment row per vault file, parented to whichever document the importer
  # happened to process first -- so a match on another document is normal and correct.
  # Duplicate rows for one filename do exist, so prefer this document's own.
  def attachment_index(document)
    rows = Attachment
      .where(parent_type: "Document")
      .joins("JOIN documents ON documents.id = attachments.parent_id")
      .where("documents.space_id = ?", document.space_id)
      .pluck("attachments.filename", "attachments.id", "attachments.parent_id")

    index = Hash.new { |h, k| h[k] = [] }
    by_id = {}
    rows.each do |filename, id, parent_id|
      index[filename] << [id, parent_id]
      by_id[id] = filename
    end
    [index, by_id]
  end

  def find_attachment(target, index, document)
    candidates = index[target].presence || index[File.basename(target)].presence
    return nil if candidates.blank?

    own = candidates.find { |_id, parent_id| parent_id == document.id }
    (own || candidates.first).first
  end

  # Filenames this document already displays, so a link duplicating an embed can be
  # recognised. Compared by *filename*, not attachment id: one vault file can have several
  # attachment rows (production has 1573 and 1605 for the same screenshot), and the row an
  # embed resolved to is often not the row a filename lookup returns.
  #
  # The id is anchored on the whole prop value -- "attachment:19" is not "attachment:195".
  def embedded_filenames(blocks, by_id)
    names = Set.new
    BlocknoteBlocks.walk_blocks(blocks) do |node|
      props = node["props"]
      next unless props.is_a?(Hash)

      url = props["url"]
      next unless url.is_a?(String) && (m = url.match(/\Aattachment:(\d+)(?:\.\w+)?\z/))

      filename = by_id[m[1].to_i]
      names << File.basename(filename) if filename
    end
    names
  end

  def rewrite_blocks(blocks, document, index, embedded)
    blocks.map { |block| rewrite_block(block, document, index, embedded) }
  end

  def rewrite_block(block, document, index, embedded)
    block = block.dup

    if block["content"].is_a?(Array)
      block["content"] = rewrite_content(block["content"], document, index, embedded)
    end
    if block["children"].is_a?(Array)
      block["children"] = rewrite_blocks(block["children"], document, index, embedded)
    end
    block
  end

  # Splitting matters: replacing a link with an anchor means one text node becomes
  # [text, link, text], so this rebuilds the array rather than editing in place.
  def rewrite_content(content, document, index, embedded)
    content.flat_map do |node|
      next [node] unless node.is_a?(Hash)

      if node["content"].is_a?(Array)
        node = node.dup
        node["content"] = rewrite_content(node["content"], document, index, embedded)
        next [node]
      end

      text = node["text"]
      next [node] unless text.is_a?(String) && text.include?("[[")

      split_text_node(node, document, index, embedded)
    end
  end

  def split_text_node(node, document, index, embedded)
    text    = node["text"]
    styles  = node["styles"] || {}
    out     = []
    cursor  = 0
    pos     = 0
    changed = false

    # Explicit match loop rather than scan-with-block: $~ is not visible from an
    # enumerator's block, so Regexp.last_match there is nil and nothing matches.
    while (match = WIKI.match(text, pos))
      pos = match.end(0)

      if match[:prefix] == "!"
        @outcome.embeds_left += 1
        next
      end

      target     = match[:target].to_s.strip
      alias_text = match[:alias].to_s.strip
      # The match begins at the captured prefix character, which is ordinary text.
      start = match.begin(0) + match[:prefix].to_s.length

      replacement = replacement_for(target, alias_text, document, index, embedded)
      next if replacement == :leave

      changed = true
      out << text_node(text[cursor...start], styles) if start > cursor
      out.concat(replacement)
      cursor = match.end(0)
    end

    return [node] unless changed

    out << text_node(text[cursor..], styles) if cursor < text.length
    out.reject { |n| n["type"] == "text" && n["text"].to_s.empty? }
  end

  def replacement_for(target, alias_text, document, index, embedded)
    attachment_id = find_attachment(target, index, document)

    if attachment_id.nil?
      # No attachment by that name -- a document link like [[2017-10-31]], or a file that
      # was never uploaded. Never infer "file" from the extension: "...meskaklinika.pl"
      # and "Sex 2.0" both look like filenames and are not.
      @outcome.skipped_not_a_file += 1 unless target.match?(/\.[A-Za-z0-9]{1,5}\z/)
      @outcome.skipped_no_attachment += 1 if target.match?(/\.[A-Za-z0-9]{1,5}\z/)
      return :leave
    end

    if embedded.include?(File.basename(target))
      # The file is already displayed by an embed; the link is a duplicate.
      if alias_text.blank? || alias_text.start_with?("Open:")
        @outcome.deleted += 1
        record_sample(:delete, target, alias_text)
        []                                    # drop it entirely
      else
        @outcome.flattened += 1
        record_sample(:flatten, target, alias_text)
        [text_node(alias_text, {})]           # keep the caption, drop the markup
      end
    else
      @outcome.resolved += 1
      record_sample(:resolve, target, alias_text)
      [link_node(attachment_id, alias_text.presence || File.basename(target))]
    end
  end

  def text_node(text, styles)
    { "type" => "text", "text" => text, "styles" => styles || {} }
  end

  def link_node(attachment_id, label)
    { "type" => "link",
      "href" => Rails.application.routes.url_helpers.attachment_path(attachment_id),
      "content" => [text_node(label, {})] }
  end

  def repair_author(document)
    document.versions.where.not(created_by_id: nil).last&.created_by
  end

  def record_sample(kind, target, alias_text)
    return if @samples.size >= 20

    @samples << { kind: kind, target: target.truncate(60), alias: alias_text.truncate(40) }
  end

  def report
    { mode: @apply ? "APPLIED" : "dry run",
      documents_changed: @changed, documents_failed: @failed,
      counts: @outcome.to_h, samples: @samples }
  end
end
