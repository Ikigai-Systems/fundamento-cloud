# Creates a document whose *comment* mentions a user, while the document content
# itself mentions nobody. Isolates ObjectReferenceReconciler.reconcile_comment
# from the version path.
space = Space.find(command_options["space_id"])
org = Organization.find(command_options["organization_id"])
user = User.find_by(email: command_options["user_email"])
membership = org.organization_memberships.find_by!(user: user)

document = Document.create!(
  title: "Document with Comment Mention",
  organization: org,
  space: space
)

Version.create!(
  document: document,
  content_blocks: [
    {
      "id" => "block1",
      "type" => "paragraph",
      "content" => [{ "type" => "text", "text" => "The mention is in the comment, not here." }]
    }
  ],
  created_by: user
)

ObjectComment.create!(
  object: document,
  organization: org,
  organization_membership: membership,
  content: [
    {
      "id" => "comment-block1",
      "type" => "paragraph",
      "content" => [
        { "type" => "text", "text" => "Ping " },
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
)
