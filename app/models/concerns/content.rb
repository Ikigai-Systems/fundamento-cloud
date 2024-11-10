# Some common methods that should be implemented by every content type we allow to edit
module Content
  extend ActiveSupport::Concern

  def archived?
    false
  end

  def draft?
    false
  end

  def display_name
    try(:name) || try(:title)
  end
end