# Operator entry point for tenant archives.
#
# A rake task rather than a UI because this is what gets reached for during an incident,
# over `bin/ecs-console`, when nobody wants to discover that the admin page needs a
# working session.
namespace :tenant do
  desc "Export one organization to a tar archive (tenant:export[<organization_id>])"
  task :export, [:organization_id] => :environment do |_task, args|
    organization_id = args[:organization_id].presence or
      abort("usage: rake 'tenant:export[<organization_id>]'\n\nSee `rake tenant:list` for ids.")

    organization = Organization.find_by(id: organization_id) or
      abort("no organization with id #{organization_id.inspect}")

    puts "exporting #{organization.name} (#{organization.id})..."
    export = TenantExport.run!(organization)

    puts "  status:  #{export.status}"
    puts "  bytes:   #{ActiveSupport::NumberHelper.number_to_human_size(export.byte_size)}"
    puts "  digest:  #{export.digest}"
    puts "  rows:    #{export.row_counts.reject { |_, n| n.zero? }.map { |t, n| "#{t}=#{n}" }.join(' ')}"
    puts "  archive: #{export.archive.filename}"
  end

  namespace :restore do
    desc "Show what restoring an export would do, without doing any of it (tenant:restore:plan[<export_id>])"
    task :plan, [:export_id] => :environment do |_task, args|
      export_id = args[:export_id].presence or
        abort("usage: rake 'tenant:restore:plan[<export_id>]'\n\nSee `rake tenant:exports` for ids.")

      export = TenantExport.find_by(id: export_id) or abort("no export with id #{export_id.inspect}")
      abort("export #{export_id} is #{export.status}, not completed") unless export.completed?

      export.archive.open do |file|
        plan = Tenant::RestorePlanner.new(
          organization: export.organization,
          reader: Tenant::ExportReader.new(file),
        ).call

        puts "restore plan for #{export.organization.name} (#{export.organization.id})"
        puts "  archive taken: #{export.created_at.utc.iso8601}"
        puts "  mode:          #{plan.mode}"
        puts

        if plan.total_to_insert.zero?
          puts "  nothing to restore -- every archived row is already present."
        else
          puts "  would insert:"
          plan.rows_to_insert.reject { |_, n| n.zero? }.each { |t, n| puts "    #{t}: #{n}" }
        end

        puts
        if plan.blocked?
          puts "  BLOCKED -- #{plan.conflicts.size} unique-index conflict(s). Nothing would be written:"
          plan.conflicts.first(20).each do |c|
            puts "    #{c[:table]} (#{c[:columns].join(', ')}) = #{c[:values].join(', ')}"
            puts "      archived row #{c[:archived_id]} cannot go back; #{c[:existing_id]} holds that key now"
          end
          puts "    ... and #{plan.conflicts.size - 20} more" if plan.conflicts.size > 20
        else
          puts "  no unique-index conflicts."
        end

        if plan.unmatchable.any?
          puts
          puts "  cannot tell whether these are already present -- restoring twice would"
          puts "  duplicate them (no unique key, or the only one is redacted):"
          plan.unmatchable.each { |t| puts "    #{t}: #{plan.rows_to_insert[t]} row(s)" }
        end

        puts
        puts "  ids reassigned on insert (integer keys are shared across tenants):"
        puts "    #{plan.remapped_tables.join(', ')}"
      end
    end
  end

  desc "List organizations with the age of their most recent successful export"
  task list: :environment do
    latest = TenantExport.completed.group(:organization_id).maximum(:created_at)

    rows = Organization.order(:name).map do |organization|
      at = latest[organization.id]
      [organization.id, organization.name, at ? "#{((Time.current - at) / 1.day).round(1)}d ago" : "never"]
    end

    width = rows.map { |id, _, _| id.length }.max.to_i
    rows.each { |id, name, age| puts format("%-#{width}s  %-40s  %s", id, name.to_s[0, 40], age) }
  end

  desc "Show the most recent exports and whether they worked"
  task exports: :environment do
    TenantExport.recent_first.limit(20).includes(:organization).each do |export|
      puts format(
        "%-20s  %-10s  %-10s  %s",
        export.created_at.utc.strftime("%Y-%m-%d %H:%M"),
        export.status,
        export.byte_size ? ActiveSupport::NumberHelper.number_to_human_size(export.byte_size) : "-",
        export.failed? ? "#{export.organization.name}: #{export.error}" : export.organization.name,
      )
    end
  end
end
