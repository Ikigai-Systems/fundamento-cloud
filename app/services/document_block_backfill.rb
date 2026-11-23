# Fills document_blocks for the saved versions that exist. A document without comments on blocks
# only needs its latest version, which is what tells a block that is there from one that is gone.
# A document with comments on blocks needs every version, to tell which version a removed block
# was last in. Idempotent: DocumentBlockReconciler never moves a mark back.
class DocumentBlockBackfill
  def self.run(batch_size: 100, &progress)
    new(batch_size, progress).run
  end

  def initialize(batch_size, progress)
    @batch_size = batch_size
    @progress = progress
  end

  def run
    commented = ObjectComment.anchored.where(object_type: "Document").distinct.pluck(:object_id).to_set
    count = 0

    Document.find_each(batch_size: @batch_size) do |document|
      versions = commented.include?(document.id) ? document.versions.order(:id) : document.versions.order(:id).last(1)
      versions.each { |version| DocumentBlockReconciler.reconcile(document, version) }

      count += 1
      @progress&.call("  Processed #{count} documents") if (count % @batch_size).zero?
    end

    @progress&.call("Backfill complete: #{count} documents, #{DocumentBlock.count} blocks")
  end
end
