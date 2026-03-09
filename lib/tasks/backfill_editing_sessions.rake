namespace :editing_sessions do
  desc "Backfill DocumentEditingSessions from Version#created_by for documents without sessions"
  task backfill: :environment do
    ActiveRecord::Base.logger = Logger.new(STDOUT)

    created = 0
    skipped = 0
    no_membership = 0

    # Cache organization memberships: { [user_id, organization_id] => membership }
    memberships = {}

    Version.includes(:document).where.not(created_by_id: nil).find_each do |version|
      document = version.document

      # Skip if this version already has an editing session for this user
      cache_key = [version.created_by_id, document.organization_id]
      membership = memberships[cache_key] ||= OrganizationMembership.find_by(
        user_id: version.created_by_id,
        organization_id: document.organization_id
      )

      if membership.nil?
        no_membership += 1
        next
      end

      # Idempotent: skip if session already exists for this version + member
      if DocumentEditingSession.exists?(version_id: version.id, member_id: membership.id)
        skipped += 1
        next
      end

      DocumentEditingSession.create!(
        document: document,
        member: membership,
        version: version,
        connected_at: version.created_at,
        disconnected_at: version.created_at,
        edited: true
      )
      created += 1
    end

    puts "\nBackfill complete: #{created} created, #{skipped} skipped (already exist), #{no_membership} skipped (no membership)"
  end
end
