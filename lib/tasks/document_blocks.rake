namespace :document_blocks do
  desc "Backfill document_blocks from existing document versions"
  task backfill: :environment do
    DocumentBlockBackfill.run(batch_size: ENV.fetch("BATCH_SIZE", 100).to_i) { |message| puts message }
  end
end
