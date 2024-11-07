class ChangeHierarchyDefaultOnSpaces < ActiveRecord::Migration[7.1]
  def change
    change_column_default :spaces, :hierarchy, from: nil, to: []
    change_column_null :spaces, :hierarchy, false, []
  end
end
