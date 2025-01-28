namespace :versions do
  desc "Make sure Mentions stored in document Versions are referencing entities by 'entityId' prop instead of 'id'"
  task rename_mentions_id_to_entity_id: :environment do
    Version.find_each do |version|
      content = version.content.each do |block|
        each_mention(block) do |mention|
          props = mention["props"]
          if props["entityId"].nil?
            props["entityId"] = props["id"]
            props["id"] = Nanoid.generate(size: 10)
          end
        end
      end
      version.update_columns(content: content)
    end
  end

  def each_mention(node, &block)
    if node&.dig("type") == "mention"
      yield node
    end
    node&.each do |key, value|
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
