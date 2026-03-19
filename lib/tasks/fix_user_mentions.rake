namespace :fix do
  desc "Fix broken user mentions with integer entityIds in comments and document versions"
  task user_mentions: :environment do
    # Build lookup: display_name -> user NPI
    # Handle potential duplicates by keeping all matches
    users_by_name = Hash.new { |h, k| h[k] = [] }
    User.find_each do |user|
      name = user.display_name
      users_by_name[name] << user.id
    end

    stats = { comments_scanned: 0, versions_scanned: 0, mentions_fixed: 0, mentions_unfixable: 0 }

    # Returns true if any mentions were fixed in the blocks array
    fix_mentions = ->(blocks) {
      return false unless blocks.is_a?(Array)

      changed = false
      traverse = ->(node) {
        if node.is_a?(Hash)
          props = node["props"]
          if node["type"] == "mention" && props.is_a?(Hash) && props["entity"] == "user" && props["entityId"].is_a?(Integer)
            title = props["title"].to_s.strip
            candidates = users_by_name[title]

            if candidates.length == 1
              props["entityId"] = candidates.first
              changed = true
              stats[:mentions_fixed] += 1
            else
              reason = candidates.empty? ? "no user found" : "ambiguous (#{candidates.length} users)"
              puts "  SKIP: mention '#{title}' (entityId=#{props["entityId"]}) - #{reason}"
              stats[:mentions_unfixable] += 1
            end
          end

          node["content"]&.each { |child| traverse.call(child) }
          node["children"]&.each { |child| traverse.call(child) }
        end
      }

      blocks.each { |block| traverse.call(block) }
      changed
    }

    # Fix ObjectComment content
    puts "Scanning object comments..."
    ObjectComment.find_each(batch_size: 100) do |comment|
      stats[:comments_scanned] += 1
      blocks = comment.content
      next unless blocks.is_a?(Array)

      if fix_mentions.call(blocks)
        comment.update!(content: blocks)
        puts "  Fixed comment #{comment.id}"
      end
    end

    # Fix Version content_blocks
    puts "Scanning document versions..."
    Version.where.not(content_blocks: nil).find_each(batch_size: 100) do |version|
      stats[:versions_scanned] += 1
      blocks = version.content_blocks
      blocks = JSON.parse(blocks) if blocks.is_a?(String)
      next unless blocks.is_a?(Array)

      if fix_mentions.call(blocks)
        version.update!(content_blocks: blocks)
        puts "  Fixed version #{version.id} (document #{version.document_id})"
      end
    end

    puts ""
    puts "Done!"
    puts "  Comments scanned: #{stats[:comments_scanned]}"
    puts "  Versions scanned: #{stats[:versions_scanned]}"
    puts "  Mentions fixed:   #{stats[:mentions_fixed]}"
    puts "  Mentions skipped: #{stats[:mentions_unfixable]}"
  end
end
