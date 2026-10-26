# Five people have edited the document, one more than the details sidebar shows as avatars.
# Sorted by first name, Stefan and Zofia are the two behind the "+2" button.
document = Document.find(command_options["document_id"])
organization = document.organization

zofia = User.create!(
  first_name: "Zofia",
  last_name: "Nowak",
  email: "zofia@ikigai.systems",
  password: "password",
  confirmed_at: Time.current
)

[User.find("user_pawel"), User.find("user_stefan"), User.find("user_maria"), User.find("user_john"), zofia].each do |user|
  member = OrganizationMembership.find_or_create_by!(organization: organization, user: user) { |m| m.role = :member }
  DocumentEditingSession.create!(document: document, member: member, connected_at: 1.hour.ago, edited: true)
end
