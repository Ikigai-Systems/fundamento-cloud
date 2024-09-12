class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  class << self
    alias_method :find_by_param!, :find
  end
end
