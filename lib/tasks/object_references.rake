namespace :object_references do
  desc "Backfill object_references from existing document versions and comments"
  task backfill: :environment do
    ObjectReferenceBackfill.run(batch_size: ENV.fetch("BATCH_SIZE", 100).to_i) { |message| puts message }
  end
end
