# frozen_string_literal: true

class UpdateTableTool < ApplicationTool
  description "Rename a table, change its icon, or both. The name must be unique within the table's space. " \
              "The icon is a single emoji, separate from the name; pass an empty string to remove it. " \
              "table_id accepts either the table's id or its name; supply space_id when names may collide across spaces."

  input_schema(
    properties: {
      table_id: { type: :string, description: "Table id or name." },
      space_id: { type: :string, description: "Optional space id to disambiguate by-name lookups." },
      name: { type: :string, description: "New name for the table, stored as given." },
      icon: { type: :string, description: "A single emoji to use as the icon, or an empty string to remove it." }
    },
    required: [:table_id]
  )

  annotations(
    title: "Update Table",
    read_only_hint: false,
    destructive_hint: false,
    idempotent_hint: true,
  )

  def self.perform(table_id:, server_context:, space_id: nil, name: nil, icon: nil)
    raise ArgumentError, "Provide a name, icon, or both" if name.nil? && icon.nil?

    pundit_user = pundit_user_from_context(server_context)

    space = nil
    if space_id.present?
      space = pundit_user.current_organization.spaces.find(space_id)
      Pundit.authorize(pundit_user, space, :show?)
    end

    table = Formula::TableLookup.new(space: space, pundit_user: pundit_user).find!(table_id)
    Pundit.authorize(pundit_user, table, :update?)

    table.assign_title_and_icon(title: name, icon: icon)
    table.save!

    MCP::Tool::Response.new(structured_content: {
      id: table.id,
      name: table.name,
      icon: table.icon&.as_json,
      space_id: table.space_id
    })
  end
end
