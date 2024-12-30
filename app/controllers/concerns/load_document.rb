module LoadDocument
  def self.from_param(param_name)
    Module.new do
      extend ActiveSupport::Concern

      define_method(:load_document) do
        @document = current_organization.documents.find_by_param!(params[param_name])
        @space = @document.space
      end
    end
  end
end