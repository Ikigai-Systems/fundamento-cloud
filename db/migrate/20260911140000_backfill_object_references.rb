# object_references is now the only source for mentions and connections, so every
# install needs rows for content written before the reconciler shipped. Self-hosted
# deployments only run migrations, never rake tasks, so the backfill has to live here.
class BackfillObjectReferences < ActiveRecord::Migration[8.1]
  def up
    ObjectReferenceBackfill.run { |message| say message }
  end

  def down
    # Data-only — the backfilled references are harmless if this is rolled back.
  end
end
