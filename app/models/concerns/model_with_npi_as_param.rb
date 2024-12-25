module ModelWithNpiAsParam
  extend ActiveSupport::Concern

  include ModelWithNpi

  included do
    class_attribute :allow_fallback_to_id, default: false
  end

  class_methods do
    def set_allow_fallback_to_id(allowed)
      self.allow_fallback_to_id = allowed
    end

    def find_by_param!(param)
      if self.allow_fallback_to_id && !param.to_i.zero?
        find_by_id!(param.to_i)
      else
        find_by_npi!(param)
      end
    end
  end

  def to_param
    npi
  end
end