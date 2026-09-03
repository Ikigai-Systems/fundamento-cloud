# Turns a version's stored summary counts into the one-line description shown in the
# history list. Table timelines need this in a way document timelines do not: "Version 7"
# tells you nothing about a table, "12 cells, +3 rows, renamed Status" does.
module TableVersionsHelper
  def table_version_summary(version)
    return "Baseline" if version.initial?
    return restored_summary(version) if version.restore?

    summary = version.summary || {}

    return "Imported #{pluralize(summary["rows"].to_i, "row")}" if summary["imported"]

    parts = change_counts(summary) + Array(summary["structure"])

    parts.any? ? parts.join(" · ") : "No changes"
  end

  private

  def restored_summary(version)
    return "Restored" if version.restored_from.blank?

    "Restored version #{version.restored_from.sequential_id}"
  end

  def change_counts(summary)
    [
      count_part(summary["cells_changed"], "cell", "cells"),
      signed_part(summary["rows_added"], "+", "row", "rows"),
      signed_part(summary["rows_deleted"], "-", "row", "rows"),
      signed_part(summary["columns_added"], "+", "column", "columns"),
      signed_part(summary["columns_removed"], "-", "column", "columns"),
    ].compact
  end

  def count_part(count, singular, plural)
    count = count.to_i
    return if count.zero?

    "#{count} #{count == 1 ? singular : plural}"
  end

  def signed_part(count, sign, singular, plural)
    part = count_part(count, singular, plural)
    return if part.nil?

    "#{sign}#{part}"
  end
end
