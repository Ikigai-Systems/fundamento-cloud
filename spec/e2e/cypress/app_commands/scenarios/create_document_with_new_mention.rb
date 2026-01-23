# Creates a document with a new user mention
space = Space.find(command_options["space_id"])
org = Organization.find(command_options["organization_id"])
user = User.find_by(email: command_options["user_email"])

document = Document.create!(
  title: "New Mention Document",
  organization: org,
  space: space
)

# Create a version with user mention
content_blocks = [
  {
    "id" => "block1",
    "type" => "paragraph",
    "content" => [
      { "type" => "text", "text" => "New mention: " },
      {
        "type" => "mention",
        "props" => {
          "id" => SecureRandom.uuid,
          "entity" => "user",
          "entityId" => user.id
        }
      }
    ]
  }
]

Version.create!(
  document: document,
  content_blocks: content_blocks,
  created_by: user
)
