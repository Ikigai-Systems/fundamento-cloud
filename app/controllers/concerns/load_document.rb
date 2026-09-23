# `.kept`: a trashed record is invisible rather than merely undeletable, so every
# controller that loads one by param 404s instead of rendering it. This is the single
# place that decides that, which is why it is worth stating here.
module LoadDocument
  def self.from_param(param_name)
    Module.new do
      extend ActiveSupport::Concern

      define_method(:load_document) do
        @document = current_organization.documents.kept.find(params[param_name])
        @space = @document.space
      end
    end
  end
end