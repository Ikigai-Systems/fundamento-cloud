namespace :fix do
  desc "Fix broken user mentions with integer entityIds in comments and document versions"
  task user_mentions: :environment do
    # Build lookup: display_name -> user NPIs (global)
    users_by_name = Hash.new { |h, k| h[k] = [] }
    User.find_each do |user|
      users_by_name[user.display_name] << user.id
    end

    # Build lookup: [display_name, organization_id] -> user NPIs (org-scoped)
    users_by_name_and_org = Hash.new { |h, k| h[k] = [] }
    OrganizationMembership.includes(:user).find_each do |mem|
      users_by_name_and_org[[mem.user.display_name, mem.organization_id]] << mem.user.id
    end

    stats = { comments_scanned: 0, versions_scanned: 0, mentions_fixed: 0, mentions_unfixable: 0, errors: 0 }

    # Resolve a mention to the correct user NPI, using org to disambiguate
    resolve_user = ->(title, organization_id) {
      # Try org-scoped first to narrow duplicates
      candidates = users_by_name_and_org[[title, organization_id]]
      candidates = users_by_name[title] if candidates.empty?

      if candidates.length == 1
        candidates.first
      else
        reason = candidates.empty? ? "no user found" : "ambiguous (#{candidates.length} users)"
        puts "  SKIP: mention '#{title}' - #{reason}"
        stats[:mentions_unfixable] += 1
        nil
      end
    }

    # Returns true if any mentions were fixed in the blocks array
    fix_mentions = ->(blocks, organization_id) {
      return false unless blocks.is_a?(Array)

      changed = false
      traverse = ->(node) {
        if node.is_a?(Hash)
          props = node["props"]
          if node["type"] == "mention" && props.is_a?(Hash) && props["entity"] == "user" && props["entityId"].is_a?(Integer)
            title = props["title"].to_s.strip
            npi = resolve_user.call(title, organization_id)
            if npi
              props["entityId"] = npi
              changed = true
              stats[:mentions_fixed] += 1
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

      if fix_mentions.call(blocks, comment.organization_id)
        comment.update!(content: blocks)
        puts "  Fixed comment #{comment.id}"
      end
    rescue => e
      stats[:errors] += 1
      puts "  ERROR on comment #{comment.id}: #{e.message}"
    end

    # Fix Version content_blocks
    puts "Scanning document versions..."
    Version.where.not(content_blocks: nil).includes(:document).find_each(batch_size: 100) do |version|
      stats[:versions_scanned] += 1
      blocks = version.content_blocks
      blocks = JSON.parse(blocks) if blocks.is_a?(String)
      next unless blocks.is_a?(Array)

      if fix_mentions.call(blocks, version.document.organization_id)
        version.update!(content_blocks: blocks)
        puts "  Fixed version #{version.id} (document #{version.document_id})"
      end
    rescue => e
      stats[:errors] += 1
      puts "  ERROR on version #{version.id}: #{e.message}"
    end

    puts ""
    puts "Done!"
    puts "  Comments scanned: #{stats[:comments_scanned]}"
    puts "  Versions scanned: #{stats[:versions_scanned]}"
    puts "  Mentions fixed:   #{stats[:mentions_fixed]}"
    puts "  Mentions skipped: #{stats[:mentions_unfixable]}"
    puts "  Errors:           #{stats[:errors]}"
  end
end
