# devise_invitable keeps every invitation it ever made: accepting or revoking one only stamps it. Rows
# that can no longer do anything are removed here, so devise_invitations doesn't grow without bound.
#
# Nothing references an invitation row, so `delete_all` is enough: there are no callbacks to run.
class InvitationPurgeJob < ApplicationJob
  queue_as :maintenance

  # Expired, revoked or superseded: dead on arrival, kept briefly in case someone asks what happened.
  DEAD_RETENTION = 30.days

  # Accepted: the record of how someone joined an organization.
  ACCEPTED_RETENTION = 90.days

  def perform
    dead_cutoff = DEAD_RETENTION.ago
    # A pending invitation stops being acceptable `invite_for` after it was sent.
    expired_cutoff = (DEAD_RETENTION + Devise.invite_for).ago

    invitations = DeviseInvitable::Invitation
    dead = invitations.where(invitation_accepted_at: nil).where(revoked_at: ..dead_cutoff)
      .or(invitations.where(invitation_accepted_at: nil).where(superseded_at: ..dead_cutoff))
      .or(invitations.pending.where(invitation_sent_at: ..expired_cutoff))
      .or(invitations.pending.where(invitation_sent_at: nil, created_at: ..expired_cutoff))
    accepted = invitations.where(invitation_accepted_at: ..ACCEPTED_RETENTION.ago)

    purged = dead.delete_all + accepted.delete_all

    Rails.logger.info("InvitationPurgeJob: purged #{purged} invitations")
  end
end
