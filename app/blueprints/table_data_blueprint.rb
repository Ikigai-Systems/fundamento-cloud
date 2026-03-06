# This should match expectations in app/javascript/components/ViewTablePanel.tsx
class TableDataBlueprint
  def self.render(data)
    columns = data[:columns]
    rows = data[:rows]

    {
      columns: columns.map { |column| serialize_column(column, rows) },
      rows: rows,
    }
  end

  def self.serialize_column(column, rows)
    {
      id: column.id,
      name: column.name,
      kind: column.kind,
      formula: column.formula,
      configuration: column.configuration,
      options: column.options || derive_options(column, rows),
    }
  end

  def self.derive_options(column, rows)
    return nil unless column.kind.in?(%w[select multi_select])

    rows
      .filter_map { |row| row[column.id] }
      .flat_map { |value| value.is_a?(Array) ? value : [value] }
      .uniq
      .map { |value| { value: value, name: value } }
  end
end
