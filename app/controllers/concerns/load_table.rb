# Loads through `current_organization.tables`, which is scoped to kept records, so a
# trashed table 404s here rather than rendering. Reach for `all_tables` only when you
# genuinely mean the trash too.
module LoadTable
  def self.from_param(param_name)
    Module.new do
      extend ActiveSupport::Concern

      define_method(:load_table) do
        @table = current_organization.tables.find(params[param_name])
        @space = @table.space
      end
    end
  end
end