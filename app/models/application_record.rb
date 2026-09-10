class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  audited

  before_create :generate_id_if_needed

  class << self
    alias_method :find_by_param!, :find

    # Opts a model out of the `audited` call above.
    #
    # `audited enabled: false` looks like it does this and does not: audited 5.8.0's
    # set_audited_options never reads :enabled, and auditing_enabled is driven by
    # Audited.store instead. Models that declared it were writing an audit row per write
    # regardless -- Tables::Cell on every cell edit.
    #
    # write_audit consults the class method, so overriding that is what actually works.
    def skip_auditing
      define_singleton_method(:auditing_enabled) { false }
    end
  end

  private

  def generate_id_if_needed
    # Automatically generate NPI for string primary keys (migrated models)
    if self.class.columns_hash["id"]&.type == :string && id.blank?
      self.id = Nanoid.generate(size: 10)
    end
  end
end
