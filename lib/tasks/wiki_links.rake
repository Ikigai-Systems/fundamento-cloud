namespace :wiki_links do
  desc "Repair Obsidian [[wiki links]] the importer left as text (dry run unless APPLY=1)"
  task repair: :environment do
    repair = WikiLinkRepair.new(
      apply: ENV["APPLY"] == "1",
      limit: ENV["LIMIT"]&.to_i,
      space_id: ENV["SPACE"].presence,
      document_id: ENV["DOC"].presence,
      logger: Logger.new($stdout)
    )

    result = repair.run

    puts
    puts "mode                : #{result[:mode]}"
    puts "documents changed   : #{result[:documents_changed]}"
    puts "documents failed    : #{result[:documents_failed]}"
    puts
    result[:counts].each { |name, count| puts "  #{name.to_s.ljust(24)} #{count}" }

    if result[:samples].any?
      puts
      puts "samples:"
      result[:samples].each { |s| puts "  #{s[:kind].to_s.ljust(8)} #{s[:target]}  |  #{s[:alias]}" }
    end

    puts
    puts "Dry run -- nothing written. Re-run with APPLY=1 to apply." unless ENV["APPLY"] == "1"
  end
end
