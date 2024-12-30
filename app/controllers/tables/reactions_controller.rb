class Tables::ReactionsController < Objects::ReactionsController
  include LoadTable.from_param(:table_npi)

  alias_method :load_resource, :load_table

  protected

  def resource
    @table
  end
end
