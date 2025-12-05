namespace :attachments do
  desc "Migrate attachments from database to Active Storage (idempotent, can be resumed)"
  task migrate_to_active_storage: :environment do
    # ActiveRecord::Base.logger = Logger.new(STDOUT)

    puts "Starting attachment migration to Active Storage..."
    puts "=" * 80

    # Count attachments that need migration (have data but no Active Storage file)
    # Use a subquery to avoid loading all records into memory
    total_count = Attachment
      .where.not(data: nil)
      .left_joins(:file_attachment)
      .where(active_storage_attachments: { id: nil })
      .count

    if total_count.zero?
      puts "✓ All attachments already migrated to Active Storage!"
      next
    end

    puts "Found #{total_count} attachments to migrate"

    batch_size = ENV.fetch("BATCH_SIZE", "50").to_i
    puts "Starting migration in batches of #{batch_size}..."
    puts ""

    migrated_count = 0
    failed_count = 0
    skipped_count = 0
    failed_ids = []
    batch_number = 0

    # Process in batches using find_in_batches to avoid loading all records at once
    Attachment
      .where.not(data: nil)
      .includes(:file_attachment)
      .find_in_batches(batch_size: batch_size) do |batch|

      batch_number += 1
      puts "Processing batch #{batch_number} (up to #{batch_size} attachments)..."

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

          # Store data size before attaching (for verification)
          original_size = attachment.data.bytesize

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

          # Verify content size matches (lightweight check)
          if attachment.file.byte_size != original_size
            raise "Content size mismatch after upload (expected #{original_size} bytes, got #{attachment.file.byte_size} bytes)"
          end

          migrated_count += 1
          print "  ✓ ##{attachment.id} "
          print "\n" if migrated_count % 10 == 0

          # Clear the data from memory after successful migration
          attachment.data = nil

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

      # Force garbage collection after each batch to free memory
      GC.start
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
    puts "Verification: Run 'rails attachments:verify_migration' to check status"
  end

  desc "Verify attachment migration status"
  task verify_migration: :environment do
    total = Attachment.count
    with_database = Attachment.where.not(data: nil).count

    # Use joins to count without loading all records
    with_active_storage = Attachment
      .joins(:file_attachment)
      .distinct
      .count

    with_both = Attachment
      .where.not(data: nil)
      .joins(:file_attachment)
      .distinct
      .count

    with_neither = Attachment
      .where(data: nil)
      .left_joins(:file_attachment)
      .where(active_storage_attachments: { id: nil })
      .count

    puts "Attachment Migration Status:"
    puts "=" * 60
    puts "Total attachments:                #{total}"
    puts "With database storage:            #{with_database}"
    puts "With Active Storage:              #{with_active_storage}"
    puts "With BOTH storages:               #{with_both}"
    puts "With NEITHER storage (invalid):   #{with_neither}"
    puts ""

    if with_neither > 0
      invalid_ids = Attachment
        .where(data: nil)
        .left_joins(:file_attachment)
        .where(active_storage_attachments: { id: nil })
        .limit(20)
        .pluck(:id)

      puts "⚠ WARNING: Found #{with_neither} attachments with no storage!"
      puts "  First 20 IDs: #{invalid_ids.join(', ')}"
      puts ""
    end

    remaining = Attachment
      .where.not(data: nil)
      .left_joins(:file_attachment)
      .where(active_storage_attachments: { id: nil })
      .count

    if remaining > 0
      puts "⏳ Migration in progress: #{remaining} attachments still need migration"
    else
      puts "✓ All attachments have been migrated to Active Storage!"
    end
  end

  desc "Display detailed attachment storage statistics"
  task storage_stats: :environment do
    total = Attachment.count
    database_count = Attachment.where.not(data: nil).count

    puts "Attachment Storage Statistics:"
    puts "=" * 60
    puts "Total attachments: #{total}"
    puts ""

    # Calculate database storage size in batches to avoid memory issues
    puts "Calculating database storage size..."
    database_size = 0
    Attachment.where.not(data: nil).select(:id, :data).find_in_batches(batch_size: 100) do |batch|
      database_size += batch.sum { |a| a.data.bytesize }
      print "."
    end
    puts ""

    # Get Active Storage size from blobs table (much more efficient)
    active_storage_count = Attachment.joins(:file_attachment).distinct.count
    active_storage_size = ActiveStorage::Blob
      .joins(:attachments)
      .where(active_storage_attachments: { record_type: "Attachment" })
      .sum(:byte_size)

    puts "Database storage:"
    puts "  Count: #{database_count}"
    puts "  Total size: #{'%.2f' % (database_size / 1024.0 / 1024.0)} MB"
    puts ""
    puts "Active Storage:"
    puts "  Count: #{active_storage_count}"
    puts "  Total size: #{'%.2f' % (active_storage_size / 1024.0 / 1024.0)} MB"
    puts ""

    if database_size > 0
      savings_potential = database_size / 1024.0 / 1024.0
      puts "Potential database savings after cleanup: #{'%.2f' % savings_potential} MB"
    end
  end
end
