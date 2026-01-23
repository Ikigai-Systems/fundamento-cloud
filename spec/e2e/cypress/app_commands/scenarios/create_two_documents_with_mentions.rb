# Creates two documents with user mentions
space = Space.find(command_options["space_id"])
org = Organization.find(command_options["organization_id"])
user = User.find_by(email: command_options["user_email"])

# First document with mention
document1 = Document.create!(
  title: "First Mention Doc",
  organization: org,
  space: space
)

content_blocks1 = [
  {
    "id" => "block1",
    "type" => "paragraph",
    "content" => [
      { "type" => "text", "text" => "Hey " },
      {
        "type" => "mention",
        "props" => {
          "id" => SecureRandom.uuid,
          "entity" => "user",
          "entityId" => user.id
        }
      },
      { "type" => "text", "text" => " first mention" }
    ]
  }
]

Version.create!(
  document: document1,
  content_blocks: content_blocks1,
  created_by: user
)

# Second document with mention
document2 = Document.create!(
  title: "Second Mention Doc",
  organization: org,
  space: space
)

content_blocks2 = [
  {
    "id" => "block2",
    "type" => "paragraph",
    "content" => [
      { "type" => "text", "text" => "Hi " },
      {
        "type" => "mention",
        "props" => {
          "id" => SecureRandom.uuid,
          "entity" => "user",
          "entityId" => user.id
        }
      },
      { "type" => "text", "text" => " second mention" }
    ]
  }
]

Version.create!(
  document: document2,
  content_blocks: content_blocks2,
  created_by: user
)
