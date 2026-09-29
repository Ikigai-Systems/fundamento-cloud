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
    end.filter_map { |reference| with_link_details(reference) }

    @outgoing = @references.select do |reference|
      reference.referenced_by == @object
    end.filter_map { |reference| with_link_details(reference) }
  end

  protected

  # Returns nil when the target cannot be seen, and the caller drops the reference.
  #
  # A reference deliberately outlives the trashing of what it points at, so that
  # untrashing makes the connection work again. `organization.documents` is scoped to
  # kept records, so the lookup has to tolerate a miss -- `find_by_param!` raised, which
  # took the whole connections tab down for any document that merely mentioned something
  # deleted. An unrecognised *type* is still a bug and still raises.
  def with_link_details(reference)
    reference.tap do |reference|
      organization = @pundit_user.current_organization

      case reference.referenced_type
      when "Table"
        referenced = organization.tables.select(:name, *HasIcon::COLUMNS).find_by(id: reference.referenced_id)
        return nil if referenced.nil?

        reference.referenced_title = referenced.name
        reference.referenced_path = table_path(reference.referenced_id)
      when "Document"
        referenced = organization.documents.select(:title, *HasIcon::COLUMNS).find_by(id: reference.referenced_id)
        return nil if referenced.nil?

        reference.referenced_title = referenced.title
        reference.referenced_path = document_path(reference.referenced_id)
      else
        raise ArgumentError.new("Unrecognized object type: #{reference.referenced_type}")
      end

      reference.referenced_icon = referenced.icon
    end
  end

end
