module LoadTable
  def self.from_param(param_name)
    Module.new do
      extend ActiveSupport::Concern

      define_method(:load_table) do
        @table = current_organization.tables.find_by_param!(params[param_name])
        @space = @table.space
      end
    end
  end
end