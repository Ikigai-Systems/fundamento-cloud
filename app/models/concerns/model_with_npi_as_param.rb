module ModelWithNpiAsParam
  extend ActiveSupport::Concern

  include ModelWithNpi

  included do
    class_attribute :allow_fallback_to_id, default: false
    class_attribute :attach_to_param, default: []
    class_attribute :additional_params_delimiter, default: "~"
  end

  class_methods do
    def set_allow_fallback_to_id(allowed)
      self.allow_fallback_to_id = allowed
    end

    def set_attach_to_param(*attrs)
      self.attach_to_param = attrs
    end

    def find_by_param!(param)
      if self.allow_fallback_to_id
        begin
          return find_by_id!(Integer(param))
        rescue ArgumentError
          # It's not a proper integer, must be NPI then
        end
      end

      if self.attach_to_param.present?
        find_by_npi!(param.split(self.additional_params_delimiter).first)
      else
        find_by_npi!(param)
      end
    end
  end

  def to_param
    if self.attach_to_param.present?
      npi +
        self.additional_params_delimiter +
        self.attach_to_param.map { send(_1.to_sym).to_s.parameterize(preserve_case: true) }.join("_")
    else
      npi
    end
  end
end