namespace :attachments do
  desc "Migrate attachments from database to Active Storage (idempotent, can be resumed)"
  task migrate_to_active_storage: :environment do
    puts "Starting attachment migration to Active Storage..."
    puts "=" * 80

    # Find attachments that need migration (have data but no Active Storage file)
    attachments_to_migrate = Attachment.where.not(data: nil)
                                       .select { |a| !a.file.attached? }

    total_count = attachments_to_migrate.count

    if total_count.zero?
      puts "✓ All attachments already migrated to Active Storage!"
      next
    end

    puts "Found #{total_count} attachments to migrate"
    puts "Starting migration in batches of 50..."
    puts ""

    migrated_count = 0
    failed_count = 0
    skipped_count = 0
    failed_ids = []

    attachments_to_migrate.each_slice(50).with_index do |batch, batch_index|
      batch_number = batch_index + 1
      puts "Processing batch #{batch_number} (#{batch.size} attachments)..."

      batch.each do |attachment|
        begin
          # Double-check file isn't already attached (race condition safety)
          if attachment.file.attached?
            puts "  ⊘ Skipping ##{attachment.id} - already has Active Storage file"
            skipped_count += 1
            next
          end

          # Validate data exists
          unless attachment.data.present?
            puts "  ⊘ Skipping ##{attachment.id} - no data in database"
            skipped_count += 1
            next
          end

          # Validate required metadata
          unless attachment.filename.present? && attachment.mime_type.present?
            puts "  ⚠ Warning: Attachment ##{attachment.id} missing filename or mime_type"
            puts "    Filename: #{attachment.filename.inspect}"
            puts "    MIME Type: #{attachment.mime_type.inspect}"
            failed_count += 1
            failed_ids << attachment.id
            next
          end

          # Attach to Active Storage
          attachment.file.attach(
            io: StringIO.new(attachment.data),
            filename: attachment.filename,
            content_type: attachment.mime_type
          )

          # Verify attachment succeeded
          unless attachment.file.attached?
            raise "Active Storage attachment failed for unknown reason"
          end

          # Verify content matches
          uploaded_content = attachment.file.download
          if uploaded_content != attachment.data
            raise "Content mismatch after upload (expected #{attachment.data.bytesize} bytes, got #{uploaded_content.bytesize} bytes)"
          end

          migrated_count += 1
          print "  ✓ ##{attachment.id} "
          print "\n" if migrated_count % 10 == 0

        rescue => e
          failed_count += 1
          failed_ids << attachment.id
          puts "\n  ✗ Failed to migrate attachment ##{attachment.id}: #{e.message}"
          puts "    Filename: #{attachment.filename}"
          puts "    MIME Type: #{attachment.mime_type}"
          puts "    Data Size: #{attachment.data&.bytesize || 0} bytes"
        end
      end

      puts "\n"
      puts "  Batch #{batch_number} complete: #{migrated_count} migrated, #{failed_count} failed, #{skipped_count} skipped"
      puts ""

      # Brief pause between batches to avoid overwhelming database/storage
      sleep(1) if batch_index < (total_count / 50)
    end

    puts "=" * 80
    puts "Migration complete!"
    puts ""
    puts "Results:"
    puts "  Total processed:            #{total_count}"
    puts "  Successfully migrated:      #{migrated_count}"
    puts "  Skipped (already migrated): #{skipped_count}"
    puts "  Failed:                     #{failed_count}"

    if failed_ids.any?
      puts ""
      puts "Failed attachment IDs:"
      puts "  #{failed_ids.join(', ')}"
      puts ""
      puts "To retry failed attachments:"
      puts "  Attachment.where(id: [#{failed_ids.join(', ')}]).each { |a| puts \"#\#{a.id}: \#{a.filename} (\#{a.mime_type})\" }"
    end

    puts ""
    puts "Verification query:"
    puts "  Attachment.where.not(data: nil).count { |a| !a.file.attached? }"
  end

  desc "Verify attachment migration status"
  task verify_migration: :environment do
    total = Attachment.count
    with_database = Attachment.where.not(data: nil).count
    with_active_storage = Attachment.count { |a| a.file.attached? }
    with_both = Attachment.where.not(data: nil).count { |a| a.file.attached? }
    with_neither = Attachment.where(data: nil).count { |a| !a.file.attached? }

    puts "Attachment Migration Status:"
    puts "=" * 60
    puts "Total attachments:                #{total}"
    puts "With database storage:            #{with_database}"
    puts "With Active Storage:              #{with_active_storage}"
    puts "With BOTH storages:               #{with_both}"
    puts "With NEITHER storage (invalid):   #{with_neither}"
    puts ""

    if with_neither > 0
      invalid_ids = Attachment.where(data: nil).select { |a| !a.file.attached? }.map(&:id)
      puts "⚠ WARNING: Found #{with_neither} attachments with no storage!"
      puts "  IDs: #{invalid_ids.join(', ')}"
      puts ""
    end

    remaining = Attachment.where.not(data: nil).count { |a| !a.file.attached? }
    if remaining > 0
      puts "⏳ Migration in progress: #{remaining} attachments still need migration"
    else
      puts "✓ All attachments have been migrated to Active Storage!"
    end
  end

  desc "Display detailed attachment storage statistics"
  task storage_stats: :environment do
    total = Attachment.count

    database_size = Attachment.where.not(data: nil).sum { |a| a.data.bytesize }
    active_storage_size = Attachment.sum { |a| a.file.attached? ? a.file.byte_size : 0 }

    puts "Attachment Storage Statistics:"
    puts "=" * 60
    puts "Total attachments: #{total}"
    puts ""
    puts "Database storage:"
    puts "  Count: #{Attachment.where.not(data: nil).count}"
    puts "  Total size: #{'%.2f' % (database_size / 1024.0 / 1024.0)} MB"
    puts ""
    puts "Active Storage:"
    puts "  Count: #{Attachment.count { |a| a.file.attached? }}"
    puts "  Total size: #{'%.2f' % (active_storage_size / 1024.0 / 1024.0)} MB"
    puts ""

    if database_size > 0
      savings_potential = database_size / 1024.0 / 1024.0
      puts "Potential database savings after cleanup: #{'%.2f' % savings_potential} MB"
    end
  end
end
