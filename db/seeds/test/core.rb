# Shared test dataset, seeded once per suite (spec/rails_helper.rb). Keep it minimal: specs that
# need more load an opt-in case with `seed "test/cases/<name>"`.

pawel = users.create :pawel, id: "user_pawel", first_name: "Pawel", last_name: "Wiadomski", email: "pawel@ikigai.systems"
stefan = users.create :stefan, id: "user_stefan", first_name: "Stefan", last_name: "Piotrowski", email: "stefan@ikigai.systems"
maria = users.create :maria, id: "user_maria", first_name: "Maria", last_name: "Awaria", email: "maria@ikigai.systems"
users.create :john, id: "user_john", first_name: "John", last_name: "Doe", email: "john@gmail.com"

ikigai = organizations.create_seed :is, id: "is", name: "Ikigai Systems"
herocoders = organizations.create_seed :hc, id: "hc", name: "HeroCoders"
organizations.create_seed :another, id: "another", name: "Another"

organization_memberships.create :om_is_pawel, id: "om_is_pawel", organization: ikigai, user: pawel, role: :manager
organization_memberships.create :om_is_stefan, id: "om_is_stefan", organization: ikigai, user: stefan, role: :member
organization_memberships.create :om_hc_pawel, id: "om_hc_pawel", organization: herocoders, user: pawel, role: :manager
organization_memberships.create :om_hc_stefan, id: "om_hc_stefan", organization: herocoders, user: stefan, role: :member
organization_memberships.create :om_hc_maria, id: "om_hc_maria", organization: herocoders, user: maria, role: :member

spaces.with hierarchy: [] do
  it.create_seed :is_default, id: "is_default", organization: ikigai, name: "Default IS", access_mode: :public
  it.create_seed :is_stefans, id: "is_stefans", organization: ikigai, name: "Stefan's Private Space", access_mode: :private
  it.create_seed :is_archived, id: "is_archived", organization: ikigai, name: "Archived IS Space", access_mode: :public, archived: true
  it.create_seed :hc_default, id: "hc_default", organization: herocoders, name: "Default HC", access_mode: :public
  it.create_seed :hc_restricted, id: "hc_restricted", organization: herocoders, name: "Restricted HC", access_mode: :restricted
  it.create_seed :hc_pawels, id: "hc_pawels", organization: herocoders, name: "Pawel's Private Space", access_mode: :private
  it.create_seed :hc_administrators, id: "hc_administrators", organization: herocoders, name: "Administrators Space", access_mode: :private
  it.create_seed :hc_archived, id: "hc_archived", organization: herocoders, name: "Archived HC Space", access_mode: :public, archived: true
end

documents.create :one, id: "one", title: "One", organization: ikigai, space: spaces.is_default
documents.create :two, id: "two", title: "Two", organization: ikigai, space: spaces.is_default
