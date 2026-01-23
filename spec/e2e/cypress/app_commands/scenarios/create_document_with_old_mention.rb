# Creates a document with an old user mention and marks it as seen
space = Space.find(command_options["space_id"])
org = Organization.find(command_options["organization_id"])
user = User.find_by(email: command_options["user_email"])

document = Document.create!(
  title: "Old Mention Document",
  organization: org,
  space: space
)

# Create a version with user mention
content_blocks = [
  {
    "id" => "block1",
    "type" => "paragraph",
    "content" => [
      { "type" => "text", "text" => "Old mention: " },
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

version = Version.create!(
  document: document,
  content_blocks: content_blocks,
  created_by: user
)

# Set created_at to past so it's considered old
version.update_column(:created_at, 2.days.ago)
