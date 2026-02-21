# This should match expectations in app/javascript/components/ViewTablePanel.tsx
class TableDataBlueprint
  def self.render(data)
    {
      columns: data[:columns].map { |column| serialize_column(column) },
      rows: data[:rows],
    }
  end

  def self.serialize_column(column)
    {
      id: column.id,
      name: column.name,
      kind: column.kind,
      formula: column.formula,
      configuration: column.configuration,
      options: column.options,
    }
  end
end
