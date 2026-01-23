class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  before_create :generate_id_if_needed

  class << self
    alias_method :find_by_param!, :find
  end

  private

  def generate_id_if_needed
    # Automatically generate NPI for string primary keys (migrated models)
    if self.class.columns_hash["id"]&.type == :string && id.blank?
      self.id = Nanoid.generate(size: 10)
    end
  end
end
