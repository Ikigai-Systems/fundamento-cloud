module ModelWithNpi
  extend ActiveSupport::Concern

  included do
    before_validation :ensure_has_npi, on: :create

    validates_presence_of :npi
  end

  def ensure_has_npi
    self.npi = Nanoid.generate(size: 10) unless self.npi.present?
  end
end