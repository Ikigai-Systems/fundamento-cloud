# One archive of one organization, and the record that it happened.
#
# Failures are recorded rather than swallowed: a table holding only successes reports
# perfect health right up to the moment somebody needs a restore.
class TenantExport < ApplicationRecord
  belongs_to :organization

  # Stored in its own service. A full tenant archive does not belong in the bucket the
  # application reads and writes all day, and the exports bucket denies the task role
  # permission to delete -- an application that can erase its own backups has none.
  has_one_attached :archive, service: Rails.application.config.tenant_export_service

  enum :status, { pending: "pending", completed: "completed", failed: "failed" }

  scope :recent_first, -> { order(created_at: :desc) }

  def self.run!(organization)
    export = create!(
      organization: organization,
      format_version: Tenant::ExportBuilder::FORMAT_VERSION,
      started_at: Time.current,
    )

    result = nil

    begin
      result = Tenant::ExportBuilder.new(organization).build

      # Attached before the record is updated, so a row that says "completed" always has
      # bytes behind it. The other order can claim success for an upload that never landed.
      export.archive.attach(
        io: result.io,
        filename: "tenant-export-#{organization.id}-#{Time.current.utc.strftime('%Y%m%d-%H%M%S')}.tar",
        content_type: "application/x-tar",
      )

      export.update!(
        status: :completed,
        digest: result.digest,
        byte_size: result.byte_size,
        row_counts: result.row_counts,
        finished_at: Time.current,
      )

      export
    rescue StandardError => e
      export.update!(status: :failed, error: "#{e.class}: #{e.message}", finished_at: Time.current)
      raise
    ensure
      result&.io&.close!
    end
  end
end
