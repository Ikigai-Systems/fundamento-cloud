module ModelWithNpiAsParam
  extend ActiveSupport::Concern

  include ModelWithNpi

  def to_param
    npi
  end
end