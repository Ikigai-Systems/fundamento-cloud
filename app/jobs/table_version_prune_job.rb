# Thins table history on a tiered schedule, the way Grist thins document snapshots: keep
# everything recent, then progressively only the last version of each hour, day, week and
# month.
#
# Deliberately inert on arrival. Tables::Version::RETENTION_POLICY is :keep_all and this
# job is not in config/recurring.yml, so nothing is pruned until a deployment opts in
# with real storage numbers in hand. Pruning a version discards the window of history it
# covers -- its snapshot and its change events alike.
class TableVersionPruneJob < ApplicationJob
  queue_as :maintenance

  # Each tier keeps the newest version within its bucket, for as long as the tier lasts.
  TIERS = [
    { bucket: :all,   older_than: 24.hours },
    { bucket: :hour,  older_than: 7.days },
    { bucket: :day,   older_than: 90.days },
    { bucket: :week,  older_than: 365.days },
    { bucket: :month, older_than: nil },
  ].freeze

  before_enqueue { throw :abort unless Tables::Version::RETENTION_POLICY == :thinned }

  def perform(table)
    return unless Tables::Version::RETENTION_POLICY == :thinned

    prunable(table).each(&:destroy)
  end

  private

  # Never prunable: pinned versions, the baseline, restores, and the current state.
  def prunable(table)
    versions = table.versions.chronological.to_a
    keep = Set.new

    keep << versions.last&.id
    versions.each { |version| keep << version.id if version.pinned? || version.initial? || version.restore? }

    versions.each_with_object([]) do |version, prunable|
      next if keep.include?(version.id)
      next if keep_for_tier?(version)

      prunable << version
    end
  end

  def keep_for_tier?(version)
    age = Time.current - version.created_at
    tier = TIERS.find { |t| t[:older_than].nil? || age < t[:older_than] }

    return true if tier[:bucket] == :all

    newest_in_bucket?(version, tier[:bucket])
  end

  def newest_in_bucket?(version, bucket)
    range = version.created_at.public_send(:"beginning_of_#{bucket}")..version.created_at.public_send(:"end_of_#{bucket}")

    version.table.versions.where(created_at: range).maximum(:sequential_id) == version.sequential_id
  end
end
