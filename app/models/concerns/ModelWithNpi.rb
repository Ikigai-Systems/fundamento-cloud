module ModelWithNpi
  extend ActiveSupport::Concern

  included do
    before_validation :generate_npi, on: :create

    validates_presence_of :npi
  end

  def generate_npi
    self.npi = Nanoid.generate(size: 10)
  end
end