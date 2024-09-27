module ModelWithNpi
  extend ActiveSupport::Concern

  included do
    before_validation :ensure_has_npi, on: :create

    validates_presence_of :npi
  end

  def generate_npi
    self.npi = Nanoid.generate(size: 10)
  end

  def ensure_has_npi
    generate_npi unless self.npi.present?
  end
end