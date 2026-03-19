namespace :object_references do
  desc "Backfill object_references from existing document versions and comments"
  task backfill: :environment do
    batch_size = ENV.fetch("BATCH_SIZE", 100).to_i

    doc_count = 0
    doc_total = Document.count
    puts "Backfilling object_references for #{doc_total} documents..."

    Document.find_each(batch_size: batch_size) do |document|
      ActiveRecord::Base.transaction do
        document.versions.order(sequential_id: :asc).each do |version|
          ObjectReferenceReconciler.reconcile(document, version)
        end

        document.comments.find_each do |comment|
          ObjectReferenceReconciler.reconcile_comment(comment)
        end
      end

      doc_count += 1
      puts "  Processed #{doc_count}/#{doc_total} documents" if (doc_count % batch_size).zero?
    end

    table_count = 0
    tables_with_comments = Table.joins(:comments).distinct
    table_total = tables_with_comments.count
    puts "Backfilling object_references for #{table_total} tables with comments..."

    tables_with_comments.find_each(batch_size: batch_size) do |table|
      ActiveRecord::Base.transaction do
        table.comments.find_each do |comment|
          ObjectReferenceReconciler.reconcile_comment(comment)
        end
      end

      table_count += 1
      puts "  Processed #{table_count}/#{table_total} tables" if (table_count % batch_size).zero?
    end

    puts "Backfill complete: #{doc_count} documents, #{table_count} tables, #{ObjectReference.count} total references"
  end
end
