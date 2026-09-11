# A source document whose content already mentions a target document, so tests can
# start from a reconciled reference and exercise what happens when it is removed.
space = Space.find(command_options["space_id"])
org = Organization.find(command_options["organization_id"])
user = User.find_by(email: command_options["user_email"])

target = Document.create!(
  title: "Target Document",
  organization: org,
  space: space
)

Version.create!(
  document: target,
  content_blocks: [
    {
      "id" => "target-block1",
      "type" => "paragraph",
      "content" => [{ "type" => "text", "text" => "I am the target." }]
    }
  ],
  created_by: user
)

source = Document.create!(
  title: "Source Document",
  organization: org,
  space: space
)

Version.create!(
  document: source,
  content_blocks: [
    {
      "id" => "source-block1",
      "type" => "paragraph",
      "content" => [
        { "type" => "text", "text" => "See " },
        {
          "type" => "mention",
          "props" => {
            "id" => SecureRandom.uuid,
            "entity" => "document",
            "entityId" => target.id
          }
        }
      ]
    }
  ],
  created_by: user
)
