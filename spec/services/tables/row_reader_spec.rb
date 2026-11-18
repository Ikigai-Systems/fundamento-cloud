require "rails_helper"

RSpec.describe Tables::RowReader, type: :service do
  fixtures :users, :organizations, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:table) { tables_tables(:projects) }

  it "needs someone to evaluate as for typed rows" do
    expect { described_class.new(table).typed_rows }.to raise_error(ArgumentError, /evaluate_as/)
  end

  it "needs someone to evaluate as for grid rows with formulas" do
    expect { described_class.new(table).grid_rows(evaluate_formulas: true) }.to raise_error(ArgumentError, /evaluate_as/)
  end

  it "reads grid rows without formulas without anyone to evaluate as" do
    expect(described_class.new(table).grid_rows(evaluate_formulas: false)).not_to be_empty
  end
end
