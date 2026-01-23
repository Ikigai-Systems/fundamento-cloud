# Creates two documents: Source Document and Target Document
space = Space.find(command_options["space_id"])
org = Organization.find(command_options["organization_id"])

Document.create!(
  title: "Source Document",
  organization: org,
  space: space
)

Document.create!(
  title: "Target Document",
  organization: org,
  space: space
)
