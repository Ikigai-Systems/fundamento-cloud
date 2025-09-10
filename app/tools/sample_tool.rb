# frozen_string_literal: true

class SampleTool < ApplicationTool
  description 'Greet a user'

  input_schema(
    properties: {
      id: { type: :integer }
    },
    required: [:id]
  )

  annotations(
    read_only_hint: true,
  )

  def self.call(id: "Hey", server_context:)
    user = User.find(id)

    MCP::Tool::Response.new([
      {
        type: "text",
        text: "Hey #{user.first_name} #{user.last_name}!"
      }
    ])
  rescue ActiveRecord::RecordNotFound
    MCP::Tool::Response.new([
      {
        type: "text",
        text: "Sorry, couldn't find that user."
      }
    ])
  end
end
