# Self-hosted deployments only run migrations, never rake tasks, so the backfill lives here.
class BackfillDocumentBlocks < ActiveRecord::Migration[8.1]
  def up
    DocumentBlockBackfill.run { |message| say message }
  end

  def down
    # Data-only: the rows are harmless if this is rolled back.
  end
end
