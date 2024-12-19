module ToReactProps
  extend ActiveSupport::Concern

  included do
    # Define a class-level accessor to specify attributes for React props
    class_attribute :react_props_attributes, default: []
  end

  class_methods do
    # Method to specify attributes to be included in React props
    def set_react_props(*attrs)
      self.react_props_attributes = attrs
    end
  end

  # Instance method to generate hash of attributes for React props
  def to_react_props
    react_props_attributes.each_with_object({}) do |attr, hash|
      hash[attr] = self.send(attr) if self.respond_to?(attr)
    end
  end
end