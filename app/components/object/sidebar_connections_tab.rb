# frozen_string_literal: true

class SidebarConnectionsTab < ViewComponent::Base
  # Can't use helpers.turbo_frame_tag because of the following bug:
  # https://github.com/ViewComponent/view_component/issues/1099
  # but the following workaround seems to do the trick:
  include Turbo::FramesHelper

  def initialize(object:, pundit_user:)
    @object = object
    @pundit_user = pundit_user
  end

  def before_render
    @references = ReferencesExtractor::all_references(Pundit.policy_scope(@pundit_user, @pundit_user.current_organization.documents))

    # Because some objects might be referenced by ID/NPI we need to make sure we show them once
    @references.uniq! { |reference| [reference.referenced_by, reference.referenced_type, reference.referenced_id] }

    @incoming = @references.select do |reference|
      reference.referenced_type == @object.class.to_s && reference.referenced_id == @object.id
    end.map { |reference| with_link_details(reference) }

    @outgoing = @references.select do |reference|
      reference.referenced_by == @object
    end.map { |reference| with_link_details(reference) }
  end

  protected

  def with_link_details(reference)
    reference.tap do |reference|
      case reference.referenced_type
      when "Table"
        reference.referenced_title = @pundit_user.current_organization.tables.select(:name).find_by_param!(reference.referenced_id).name
        reference.referenced_path = table_path(reference.referenced_id)
      when "Document"
        reference.referenced_title = @pundit_user.current_organization.documents.select(:title).find_by_param!(reference.referenced_id).title
        reference.referenced_path = document_path(reference.referenced_id)
      else
        raise ArgumentError.new("Unrecognized object type: #{reference.referenced_type}")
      end
    end
  end

end
