class ListSpacesTool < ApplicationTool
  description "This tools lists all spaces that are available to the user."

  input_schema(
    properties: {}
  )

  annotations(
    read_only_hint: true,
  )

  def self.call(message:, server_context:)
    MCP::Tool::Response.new([
      {
        type: "text",
        text: "OK"
      }
    ])
  end
end