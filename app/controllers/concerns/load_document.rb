module LoadDocument
  extend ActiveSupport::Concern

  protected

  def load_document
    @document = current_organization.documents.find_by_param!(params[:document_npi])
    @space = @document.space
  end
end