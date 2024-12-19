module ModelWithNpiAsParam
  extend ActiveSupport::Concern

  include ModelWithNpi

  class_methods do
    def find_by_param!(param)
      find_by_npi!(param)
    end
  end

  def to_param
    npi
  end
end