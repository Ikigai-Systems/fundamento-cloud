namespace :fundamento do
  desc "Create query to monitor basic usage statistics, see https://meta.ikigai.systems/question/35-fundamento-usage-stats"
  task stats: :environment do
    tables = [
      "users",
      "organization_users",
      "documents",
      "tables",
      "api_tokens",
      "attachments",
      "automations",
      "favorites",
      "object_reactions",
      "organizations",
      "public_links",
      "spaces",
      "table_cells",
      "teams"
    ]

    query = <<~SQL.strip_heredoc
      WITH weekly_counts AS (
        %s
      ),
      cumulative_counts AS (
        SELECT
          table_name,
          week_start,
          SUM(row_count) OVER (PARTITION BY table_name ORDER BY week_start) AS cumulative_row_count
        FROM weekly_counts
      )
      SELECT
        table_name,
        week_start,
        cumulative_row_count
      FROM cumulative_counts
      WHERE week_start >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 year'
      ORDER BY table_name, week_start;
    SQL

    union_all_queries = tables.map do |table|
      <<~SQL.strip_heredoc
        SELECT
          '#{table}' AS table_name,
          DATE_TRUNC('week', created_at) AS week_start,
          COUNT(*) AS row_count
        FROM #{table}
        WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 year'
        GROUP BY week_start
      SQL
    end

    final_query = format(query, union_all_queries.join(" UNION ALL "))
    puts final_query
  end
end
