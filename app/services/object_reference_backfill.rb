# Rebuilds object_references from the BlockNote content of every document version
# and every comment. ObjectReferenceReconciler upserts by source_node_id, so this
# is idempotent — safe to re-run, or to resume after a partial run.
class ObjectReferenceBackfill
  def self.run(batch_size: 100, &progress)
    new(batch_size, progress).run
  end

  def initialize(batch_size, progress)
    @batch_size = batch_size
    @progress = progress
  end

  def run
    documents = backfill_documents
    tables = backfill_tables

    report "Backfill complete: #{documents} documents, #{tables} tables, #{ObjectReference.count} total references"
  end

  private

  def backfill_documents
    total = Document.count
    report "Backfilling object_references for #{total} documents..."

    count = 0
    Document.find_each(batch_size: @batch_size) do |document|
      ActiveRecord::Base.transaction do
        document.versions.order(sequential_id: :asc).each do |version|
          ObjectReferenceReconciler.reconcile(document, version)
        end

        document.comments.find_each do |comment|
          ObjectReferenceReconciler.reconcile_comment(comment)
        end
      end

      count += 1
      report "  Processed #{count}/#{total} documents" if (count % @batch_size).zero?
    end

    count
  end

  def backfill_tables
    tables_with_comments = Table.joins(:comments).distinct
    total = tables_with_comments.count
    report "Backfilling object_references for #{total} tables with comments..."

    count = 0
    tables_with_comments.find_each(batch_size: @batch_size) do |table|
      ActiveRecord::Base.transaction do
        table.comments.find_each do |comment|
          ObjectReferenceReconciler.reconcile_comment(comment)
        end
      end

      count += 1
      report "  Processed #{count}/#{total} tables" if (count % @batch_size).zero?
    end

    count
  end

  def report(message)
    @progress&.call(message)
  end
end
