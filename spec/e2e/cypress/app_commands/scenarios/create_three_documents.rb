# Creates three documents: Main Document, Ref Document 1, Ref Document 2
space = Space.find(command_options["space_id"])
org = Organization.find(command_options["organization_id"])

Document.create!(
  title: "Main Document",
  organization: org,
  space: space
)

Document.create!(
  title: "Ref Document 1",
  organization: org,
  space: space
)

Document.create!(
  title: "Ref Document 2",
  organization: org,
  space: space
)
