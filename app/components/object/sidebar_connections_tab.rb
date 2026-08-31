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

  ICON_COLUMNS = [:icon_type, :icon_value].freeze

  def with_link_details(reference)
    reference.tap do |reference|
      organization = @pundit_user.current_organization

      case reference.referenced_type
      when "Table"
        referenced = organization.tables.select(:name, *ICON_COLUMNS).find_by_param!(reference.referenced_id)
        reference.referenced_title = referenced.name
        reference.referenced_path = table_path(reference.referenced_id)
      when "Document"
        referenced = organization.documents.select(:title, *ICON_COLUMNS).find_by_param!(reference.referenced_id)
        reference.referenced_title = referenced.title
        reference.referenced_path = document_path(reference.referenced_id)
      else
        raise ArgumentError.new("Unrecognized object type: #{reference.referenced_type}")
      end

      reference.referenced_icon = referenced.icon
    end
  end

end
