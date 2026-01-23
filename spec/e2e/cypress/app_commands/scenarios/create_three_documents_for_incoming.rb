# Creates three documents for testing incoming references
space = Space.find(command_options["space_id"])
org = Organization.find(command_options["organization_id"])

Document.create!(
  title: "Target Doc",
  organization: org,
  space: space
)

Document.create!(
  title: "Source Doc 1",
  organization: org,
  space: space
)

Document.create!(
  title: "Source Doc 2",
  organization: org,
  space: space
)
