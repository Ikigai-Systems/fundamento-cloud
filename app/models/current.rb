# Who is acting right now, and in what capacity. Set from controllers, from Warden
# strategies during authentication, and explicitly in jobs and MCP requests where there
# is no controller to infer it from.
#
# Identity only. State that belongs to one feature gets its own CurrentAttributes class
# rather than accumulating here -- see Tables::RecordingState.
class Current < ActiveSupport::CurrentAttributes
  SOURCES = %w[ui formula mcp api seed system].freeze

  attribute :user
  attribute :organization
  attribute :change_source, default: "system"

  # Runs the block with a different origin, restoring the previous one afterwards, so
  # nested writes (a formula triggered from the UI) are attributed to the inner source.
  def self.with_change_source(source)
    previous = change_source
    self.change_source = source.to_s
    yield
  ensure
    self.change_source = previous
  end
end
