require "rails_helper"

# The row and column order is a singly linked list, and a broken one is not merely
# untidy: every read path walks it. A production table was found with three rows all
# claiming the same predecessor, which the old completeness check let through.
RSpec.describe "Table#order_linked_list", type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:table) { tables_tables(:projects) }

  it "walks a healthy chain in order" do
    expect(table.rows_in_order.map(&:id))
      .to eq %w[projects_row_1 projects_row_2 projects_row_3]
  end

  it "returns nothing for an empty collection" do
    expect(table.order_linked_list([], :previous_row_id)).to eq []
  end

  # index_by collapses records that share a predecessor, so counting keys made 34 rows
  # look like 32 and the check passed while two rows vanished from the view.
  it "refuses a forked chain rather than silently dropping a branch" do
    tables_rows(:projects_row_3).update_columns(previous_row_id: tables_rows(:projects_row_1).id)

    expect { table.reload.rows_in_order }
      .to raise_error(IndexError, /Incomplete linked list/)
  end

  it "refuses a chain with no head" do
    tables_rows(:projects_row_1).update_columns(previous_row_id: tables_rows(:projects_row_3).id)

    expect { table.reload.rows_in_order }
      .to raise_error(IndexError, /Incomplete linked list/)
  end

  # A dangling previous_row_id cannot happen -- the foreign key forbids it -- so a chain
  # only breaks by forking or by growing a second head.
  it "refuses a chain with two heads, leaving one run unreachable" do
    tables_rows(:projects_row_2).update_columns(previous_row_id: nil)

    expect { table.reload.rows_in_order }
      .to raise_error(IndexError, /Incomplete linked list/)
  end

  it "applies the same rules to columns" do
    tables_columns(:project_description).update_columns(previous_column_id: tables_columns(:project_key).id)

    expect { table.reload.columns_in_order }
      .to raise_error(IndexError, /Incomplete linked list/)
  end
end
