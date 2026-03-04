class Version < ApplicationRecord
  belongs_to :document
  belongs_to :created_by, class_name: "User", optional: true

  has_many :editing_sessions, class_name: "DocumentEditingSession", dependent: :nullify
  has_many :editor_sessions, -> { where(edited: true) }, class_name: "DocumentEditingSession"

  def contributors
    if editing_sessions.loaded?
      editing_sessions.map { |s| s.member.user }.uniq.sort_by { |u| [u.first_name, u.last_name] }
    else
      User.joins(organization_memberships: :editing_sessions)
          .where(document_editing_sessions: { version_id: id })
          .distinct
          .order(:first_name, :last_name)
    end
  end

  scope :latest, -> { order(updated_at: :desc).first }

  before_create :set_sequential_id

  after_commit :broadcast_mentions_updated, on: [:create, :update, :destroy] # does :update make sense here? [STE 30-01-2025]

  def broadcast_mentions_updated
    broadcast_refresh_to ["mentions_list", self.document.organization]
  end

  # Automatically use the sequential ID in URLs
  def to_param
    self.sequential_id.to_s
  end

  private

  def set_sequential_id
    # Use PostgreSQL advisory lock to prevent race conditions
    # Lock is document-specific using document_id as key
    # This ensures no duplicate sequential_ids even under concurrent writes
    lock_key = Zlib.crc32("document_#{document_id}_versions")

    self.class.transaction do
      self.class.connection.execute("SELECT pg_advisory_xact_lock(#{lock_key})")
      self.sequential_id = document.versions.maximum(:sequential_id).to_i + 1
    end
  end
end
