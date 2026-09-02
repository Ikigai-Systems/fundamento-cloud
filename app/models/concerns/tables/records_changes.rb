# Emits change events for a table entity. Including classes describe what a create,
# update or destroy means in table terms via #table_change_events_for; this concern owns
# the plumbing and the enabled/suppressed checks.
module Tables::RecordsChanges
  extend ActiveSupport::Concern

  included do
    after_create  { record_table_changes(:create) }
    after_update  { record_table_changes(:update) }
    after_destroy { record_table_changes(:destroy) }
  end

  private

  def record_table_changes(action)
    return unless Tables::ChangeRecorder.enabled?

    table_change_events_for(action).each do |kind, payload|
      Tables::ChangeRecorder.record(
        table: table,
        organization_id: organization_id,
        kind: kind,
        payload: payload,
      )
    end
  end

  # [[kind, payload], ...]
  def table_change_events_for(_action)
    []
  end
end
