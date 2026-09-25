# Loads through `current_organization.documents`, which is scoped to kept records, so a
# trashed document 404s here rather than rendering. Reach for `all_documents` only when
# you genuinely mean the trash too.
module LoadDocument
  def self.from_param(param_name)
    Module.new do
      extend ActiveSupport::Concern

      define_method(:load_document) do
        @document = current_organization.documents.find(params[param_name])
        @space = @document.space
      end
    end
  end
end