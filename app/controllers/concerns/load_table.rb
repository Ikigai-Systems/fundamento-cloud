# `.kept`: a trashed record is invisible rather than merely undeletable, so every
# controller that loads one by param 404s instead of rendering it. This is the single
# place that decides that, which is why it is worth stating here.
module LoadTable
  def self.from_param(param_name)
    Module.new do
      extend ActiveSupport::Concern

      define_method(:load_table) do
        @table = current_organization.tables.kept.find(params[param_name])
        @space = @table.space
      end
    end
  end
end