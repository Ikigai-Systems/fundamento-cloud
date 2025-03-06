class MentionsExtractor
  def self.get_all_mentions(documents, user)
    all_mentions = []

    documents.includes(:versions).each do |document|
      document.versions.each do |version|
        all_mentions.concat(mentions_from_blocknote(user, version.content, version))
      end
    end

    all_mentions.group_by { |mention| mention["props"]["id"] }
                .map do |mention_id, mentions|
      sorted_mentions = mentions.sort_by { |elem| elem[:version]["sequential_id"] }
      sorted_mentions.first.merge({ most_recent_version: sorted_mentions.last[:version] })
    end
  end

  private

  def self.mentions_from_blocknote(user, blocknote_document, version)
    assert blocknote_document.is_a?(Array), "BlockNote document should be an Array"

    all_mentions = []

    blocknote_document.each do |block|
      each_mention(block) do |mention|
        if mention.dig("props", "entity") == "user" && mention.dig("props", "entityId") == user.id
          all_mentions.push(mention.merge({ version: version }))
        end
      end
    end

    all_mentions
  end

  def self.each_mention(node, &block)
    return unless node.is_a? Hash

    if node.dig("type") == "mention"
      yield node
    end
    node.each do |key, value|
      if key.is_a? Hash
        each_mention(key, &block)
      end

      if value.is_a? Hash
        each_mention(value, &block)
      elsif value.is_a? Array
        value.each { |elem| each_mention(elem, &block) }
      end
    end
  end
end
