namespace :imports do
  desc "Backfill converted-document sources and repair [[file.ext]] mentions (dry run unless applied)"
  task :backfill, [:apply] => :environment do |_task, args|
    # Accepts both forms: `imports:backfill[apply]` and APPLY=1. The bracket form matters
    # for `ecs-exec`, which execs the command without a shell -- a leading APPLY=1 there
    # is taken as a binary name, and passing it through the local environment does not
    # reach the container at all.
    apply = args[:apply].to_s == "apply" || ENV["APPLY"] == "1"

    result = ImportBackfill.new(apply: apply, logger: Logger.new($stdout)).run

    puts
    puts "mode                 : #{result[:mode]}"
    puts "sources attached     : #{result[:sources_attached]}"
    puts "mentions fixed       : #{result[:mentions_fixed]}"
    puts "documents changed    : #{result[:documents_changed]}"
    puts "mentions left broken : #{result[:mentions_left_broken]}   (targets that are genuinely absent)"
    puts "failed               : #{result[:failed]}"

    if result[:samples].any?
      puts
      puts "samples:"
      result[:samples].each { |s| puts "  #{s[:kind].to_s.ljust(8)} #{s[:label].ljust(52)} #{s[:document]}" }
    end

    puts
    puts "Dry run -- nothing written. Re-run as imports:backfill[apply] to apply." unless apply
  end
end
