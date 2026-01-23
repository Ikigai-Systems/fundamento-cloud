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
    @references.uniq! { |reference| [reference.referenced_by, reference.object_type, reference.object_id] }

    @incoming = @references.select do |reference|
      reference.object_type == @object.class.to_s && reference.object_id == @object.id
    end.map { |reference| with_link_details(reference) }

    @outgoing = @references.select do |reference|
      reference.referenced_by == @object
    end.map { |reference| with_link_details(reference) }
  end

  protected

  def with_link_details(reference)
    reference.tap do |reference|
      case reference.object_type
      when "Table"
        reference.object_title = @pundit_user.current_organization.tables.select(:name).find_by_param!(reference.object_id).name
        reference.object_path = table_path(reference.object_id)
      when "Document"
        reference.object_title = @pundit_user.current_organization.documents.select(:title).find_by_param!(reference.object_id).title
        reference.object_path = document_path(reference.object_id)
      else
        raise ArgumentError.new("Unrecognized object type: #{reference.object_type}")
      end
    end
  end

end
