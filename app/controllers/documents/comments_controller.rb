class Documents::CommentsController < Objects::CommentsController
  include LoadDocument.from_param(:document_npi)

  alias_method :load_resource, :load_document

  protected

  def resource
    @document
  end
end
