# db/seeds/organizations/marketing_agency/seed.rb
#
# Seed scenario: BrightPath Media - a 6-person marketing agency.
# See README.md in this directory for full narrative context.

puts "\n=== Seeding: BrightPath Media (Marketing Agency) ==="

t = timeline

# Helper to resolve content paths relative to this scenario directory
scenario_dir = Pathname.new(__dir__)

# ─── Organization ───────────────────────────────────────────────

org = organizations.create_seed :brightpath,
  name: "BrightPath Media",
  created_at: t.company_founded,
  updated_at: t.company_founded

# ─── Users ──────────────────────────────────────────────────────

sarah = users.create :sarah_chen,
  first_name: "Sarah", last_name: "Chen",
  email: "sarah@brightpath.example.com"

james = users.create :james_rivera,
  first_name: "James", last_name: "Rivera",
  email: "james@brightpath.example.com"

priya = users.create :priya_patel,
  first_name: "Priya", last_name: "Patel",
  email: "priya@brightpath.example.com"

marcus = users.create :marcus_thompson,
  first_name: "Marcus", last_name: "Thompson",
  email: "marcus@brightpath.example.com"

elena = users.create :elena_vasquez,
  first_name: "Elena", last_name: "Vasquez",
  email: "elena@brightpath.example.com"

alex = users.create :alex_kim,
  first_name: "Alex", last_name: "Kim",
  email: "alex@brightpath.example.com"

# ─── Organization Memberships ──────────────────────────────────

sarah_membership = organization_memberships.create :sarah_membership,
  user: sarah, organization: org, role: :manager,
  created_at: t.company_founded, updated_at: t.company_founded

james_membership = organization_memberships.create :james_membership,
  user: james, organization: org, role: :member,
  created_at: t.around(t.first_week), updated_at: t.around(t.first_week)

priya_membership = organization_memberships.create :priya_membership,
  user: priya, organization: org, role: :member,
  created_at: t.around(t.first_week), updated_at: t.around(t.first_week)

marcus_membership = organization_memberships.create :marcus_membership,
  user: marcus, organization: org, role: :member,
  created_at: t.around(t.first_week + 2.days), updated_at: t.around(t.first_week + 2.days)

elena_membership = organization_memberships.create :elena_membership,
  user: elena, organization: org, role: :member,
  created_at: t.around(t.first_week + 3.days), updated_at: t.around(t.first_week + 3.days)

alex_membership = organization_memberships.create :alex_membership,
  user: alex, organization: org, role: :member,
  created_at: t.around(t.recent), updated_at: t.around(t.recent)

# ─── Spaces ─────────────────────────────────────────────────────

hq_space = spaces.create_seed :brightpath_hq,
  name: "BrightPath HQ", organization: org, access_mode: :public,
  created_at: t.company_founded, updated_at: t.company_founded

client_space = spaces.create_seed :client_projects,
  name: "Client Projects", organization: org, access_mode: :restricted,
  created_at: t.around(t.first_week), updated_at: t.around(t.steady_state)

creative_space = spaces.create_seed :creative_lab,
  name: "Creative Lab", organization: org, access_mode: :public,
  created_at: t.around(t.first_week + 1.day), updated_at: t.around(t.steady_state)

# ─── Tables ─────────────────────────────────────────────────────
# Created before documents so we can reference their NPIs in markdown placeholders

campaign_tracker = tables.create_from_definition :campaign_tracker,
  definition_path: scenario_dir.join("content/tables/campaign-tracker.yml"),
  space: client_space, organization: org,
  created_at: t.around(t.ramp_up), updated_at: t.around(t.steady_state)

content_calendar = tables.create_from_definition :content_calendar,
  definition_path: scenario_dir.join("content/tables/content-calendar.yml"),
  space: client_space, organization: org,
  created_at: t.around(t.ramp_up + 1.week), updated_at: t.around(t.recent)

vacation_tracker = tables.create_from_definition :vacation_tracker,
  definition_path: scenario_dir.join("content/tables/vacation-tracker.yml"),
  space: hq_space, organization: org,
  created_at: t.around(t.first_week + 3.days), updated_at: t.around(t.steady_state)

client_contacts = tables.create_from_definition :client_contacts,
  definition_path: scenario_dir.join("content/tables/client-contacts.yml"),
  space: client_space, organization: org,
  created_at: t.around(t.ramp_up), updated_at: t.around(t.steady_state)

expense_reports = tables.create_from_definition :expense_reports,
  definition_path: scenario_dir.join("content/tables/expense-reports.yml"),
  space: hq_space, organization: org,
  created_at: t.around(t.ramp_up + 2.weeks), updated_at: t.around(t.recent)

# ─── Documents: BrightPath HQ ──────────────────────────────────

welcome_doc = documents.create_from_markdown :bp_welcome,
  markdown_path: scenario_dir.join("content/documents/welcome-to-brightpath.md"),
  space: hq_space, organization: org, author: sarah,
  created_at: t.company_founded, updated_at: t.around(t.first_week)

# Set as home document for the HQ space
hq_space.update!(home_document: welcome_doc)

vacation_doc = documents.create_from_markdown :bp_vacation_policy,
  markdown_path: scenario_dir.join("content/documents/vacation-policy.md"),
  space: hq_space, organization: org, author: sarah,
  created_at: t.around(t.first_week), updated_at: t.around(t.onboarding_done)

travel_doc = documents.create_from_markdown :bp_travel_reimbursement,
  markdown_path: scenario_dir.join("content/documents/travel-reimbursement-policy.md"),
  space: hq_space, organization: org, author: sarah,
  created_at: t.around(t.first_week + 1.day), updated_at: t.around(t.onboarding_done)

ooo_doc = documents.create_from_markdown :bp_out_of_office,
  markdown_path: scenario_dir.join("content/documents/out-of-office-guidelines.md"),
  space: hq_space, organization: org, author: sarah,
  created_at: t.around(t.first_week + 1.day), updated_at: t.around(t.onboarding_done)

onboarding_doc = documents.create_from_markdown :bp_onboarding_checklist,
  markdown_path: scenario_dir.join("content/documents/new-hire-onboarding-checklist.md"),
  space: hq_space, organization: org, author: sarah,
  created_at: t.around(t.first_week + 2.days), updated_at: t.around(t.recent)

meeting_doc = documents.create_from_markdown :bp_meeting_notes,
  markdown_path: scenario_dir.join("content/documents/team-meeting-notes.md"),
  space: hq_space, organization: org, author: sarah,
  table_placeholders: { "vacation_tracker" => vacation_tracker },
  created_at: t.around(t.recent), updated_at: t.around(t.recent + 1.day)

# ─── Documents: Client Projects ────────────────────────────────

gtm_doc = documents.create_from_markdown :greenleaf_gtm,
  markdown_path: scenario_dir.join("content/documents/greenleaf-gtm-strategy.md"),
  space: client_space, organization: org, author: james,
  table_placeholders: { "campaign_tracker" => campaign_tracker },
  created_at: t.around(t.ramp_up), updated_at: t.around(t.steady_state)

campaign_brief_doc = documents.create_from_markdown :greenleaf_q1_brief,
  markdown_path: scenario_dir.join("content/documents/greenleaf-q1-campaign-brief.md"),
  space: client_space, organization: org, author: james,
  created_at: t.around(t.ramp_up + 1.week), updated_at: t.around(t.steady_state)

brand_voice_doc = documents.create_from_markdown :urbanfit_brand_voice,
  markdown_path: scenario_dir.join("content/documents/urbanfit-brand-voice-guide.md"),
  space: client_space, organization: org, author: priya,
  created_at: t.around(t.steady_state), updated_at: t.around(t.steady_state + 1.week)

instagram_doc = documents.create_from_markdown :urbanfit_instagram,
  markdown_path: scenario_dir.join("content/documents/urbanfit-instagram-campaign.md"),
  space: client_space, organization: org, author: elena,
  created_at: t.around(t.steady_state + 3.days), updated_at: t.around(t.recent)

technova_doc = documents.create_from_markdown :technova_proposal,
  markdown_path: scenario_dir.join("content/documents/technova-proposal-draft.md"),
  space: client_space, organization: org, author: james,
  created_at: t.around(t.recent), updated_at: t.around(t.today)

# ─── Documents: Creative Lab ───────────────────────────────────

calendar_template_doc = documents.create_from_markdown :content_calendar_template,
  markdown_path: scenario_dir.join("content/documents/content-calendar-template.md"),
  space: creative_space, organization: org, author: elena,
  table_placeholders: { "content_calendar" => content_calendar },
  created_at: t.around(t.ramp_up + 2.weeks), updated_at: t.around(t.steady_state)

brainstorm_doc = documents.create_from_markdown :spring_brainstorm,
  markdown_path: scenario_dir.join("content/documents/campaign-brainstorm-spring.md"),
  space: creative_space, organization: org, author: james,
  created_at: t.around(t.steady_state + 1.week), updated_at: t.around(t.recent)

design_doc = documents.create_from_markdown :design_guidelines,
  markdown_path: scenario_dir.join("content/documents/design-system-guidelines.md"),
  space: creative_space, organization: org, author: marcus,
  created_at: t.around(t.onboarding_done), updated_at: t.around(t.steady_state)

# ─── Backfill: Campaign Tracker "Brief" column ────────────────
# Tables are created before documents (for NPI placeholders), so we
# link campaign rows to their related docs after both exist.

brief_col = campaign_tracker.columns.find_by!(name: "Brief")
rows_by_campaign = campaign_tracker.rows.index_by { |r|
  r.cells.find_by(column: campaign_tracker.columns.find_by!(name: "Campaign"))&.value
}

{
  "Spring Harvest Launch"       => [gtm_doc, campaign_brief_doc],
  "Organic Meal Kits Promo"     => [gtm_doc, campaign_brief_doc],
  "Farm-to-Table Awareness"     => [gtm_doc],
  "New Year Fitness Push"       => [brand_voice_doc, instagram_doc],
  "Spring Workout Collection"   => [brand_voice_doc, instagram_doc],
  "UrbanFit App Download Drive" => [brand_voice_doc],
  "Athleisure Lifestyle Series" => [brand_voice_doc],
  "TechNova Brand Awareness"    => [technova_doc],
  "Developer Community Outreach" => [technova_doc],
  "TechNova Product Launch"     => [technova_doc],
}.each do |campaign_name, docs|
  row = rows_by_campaign[campaign_name]
  next unless row

  cell = row.cells.find_or_initialize_by(column: brief_col)
  cell.update!(
    table: campaign_tracker,
    value: docs.map(&:id).join(","),
    organization: org
  )
end

puts "  [Table] Campaign Tracker briefs linked (#{rows_by_campaign.size} rows)"

# ─── Comments ───────────────────────────────────────────────────
# ObjectComment stores content as JSON (BlockNote-style blocks)

def self.comment_content(text)
  [{ "type" => "paragraph", "content" => [{ "type" => "text", "text" => text }] }]
end

# Sarah encourages James on the TechNova proposal
object_comments.create(
  organization: org, organization_membership: sarah_membership,
  object: technova_doc,
  content: comment_content("This looks great, James! I love the data-driven approach. Let's make sure we highlight our social media analytics capabilities in the pitch."),
  created_at: t.around(t.recent + 1.day), updated_at: t.around(t.recent + 1.day)
)

# Priya asks about GTM strategy, James replies
priya_gtm_comment = object_comments.create(
  organization: org, organization_membership: priya_membership,
  object: gtm_doc,
  content: comment_content("Should we increase the Instagram budget for Q2? The engagement metrics from GreenLeaf's last campaign were really strong on that platform."),
  created_at: t.around(t.ramp_up + 5.days), updated_at: t.around(t.ramp_up + 5.days)
)

object_comments.create(
  organization: org, organization_membership: james_membership,
  object: gtm_doc,
  content: comment_content("Good call, Priya. I've updated the budget split. Let's review it in the next client sync."),
  created_at: t.around(t.ramp_up + 6.days), updated_at: t.around(t.ramp_up + 6.days)
)

# Alex asks about onboarding, Sarah answers
object_comments.create(
  organization: org, organization_membership: alex_membership,
  object: onboarding_doc,
  content: comment_content("Hi! Quick question - should I set up my accounts on all the social platforms listed here, or just the ones for my assigned clients?"),
  created_at: t.around(t.recent + 2.days), updated_at: t.around(t.recent + 2.days)
)

object_comments.create(
  organization: org, organization_membership: sarah_membership,
  object: onboarding_doc,
  content: comment_content("Great question, Alex! Just set up accounts for the platforms your assigned clients use. James will walk you through the specifics in your 1:1 tomorrow."),
  created_at: t.around(t.recent + 2.days + 3.hours), updated_at: t.around(t.recent + 2.days + 3.hours)
)

# Elena comments on content calendar
object_comments.create(
  organization: org, organization_membership: elena_membership,
  object: calendar_template_doc,
  content: comment_content("Heads up - there's a scheduling conflict for the GreenLeaf posts next Tuesday. I've moved them to Wednesday to avoid overlap with the UrbanFit launch."),
  created_at: t.around(t.recent + 3.days), updated_at: t.around(t.recent + 3.days)
)

# ─── Reactions ──────────────────────────────────────────────────

# Marcus reacts to the brainstorm doc
object_reactions.create(
  organization: org, organization_membership: marcus_membership,
  object: brainstorm_doc, emoji: "\u{1F44D}",
  created_at: t.around(t.steady_state + 1.week + 1.day)
)

# Sarah reacts to the GTM strategy
object_reactions.create(
  organization: org, organization_membership: sarah_membership,
  object: gtm_doc, emoji: "\u{1F3AF}",
  created_at: t.around(t.ramp_up + 2.days)
)

# Elena reacts to Priya's GTM comment
object_reactions.create(
  organization: org, organization_membership: elena_membership,
  object: priya_gtm_comment, emoji: "\u{1F44D}",
  created_at: t.around(t.ramp_up + 5.days + 2.hours)
)

# ─── Document Editing Sessions ─────────────────────────────────
# Simulate who participated in editing each document.
# Each document has a single version (from create_from_markdown).
# Sessions reflect the narrative: author always edited, others reviewed or contributed.

def self.create_editing_session(document:, member:, version:, connected_at:, disconnected_at:, edited:)
  DocumentEditingSession.create!(
    document: document,
    member: member,
    version: version,
    connected_at: connected_at,
    disconnected_at: disconnected_at,
    edited: edited
  )
end

# Helper to create sessions for a document with its author + reviewers/contributors
def self.seed_editing_sessions(document:, author_membership:, participants:, timeline:)
  version = document.versions.first
  doc_created = document.created_at

  # Author always has an editing session
  session_start = timeline.around(doc_created - 1.hour)
  session_end = timeline.around(doc_created + 2.hours)
  create_editing_session(
    document: document, member: author_membership, version: version,
    connected_at: session_start, disconnected_at: session_end, edited: true
  )

  # Each participant gets a session (reviewing or contributing)
  participants.each do |participant|
    member = participant[:member]
    edited = participant.fetch(:edited, false)
    # Participants typically connect after the author started
    p_start = timeline.around(doc_created + rand(30..120).minutes)
    p_end = timeline.around(p_start + rand(20..90).minutes)
    create_editing_session(
      document: document, member: member, version: version,
      connected_at: p_start, disconnected_at: p_end, edited: edited
    )
  end
end

puts "  Seeding editing sessions..."

# BrightPath HQ documents

# Welcome doc: Sarah authored, James and Priya reviewed
seed_editing_sessions(
  document: welcome_doc, author_membership: sarah_membership, timeline: t,
  participants: [
    { member: james_membership, edited: false },
    { member: priya_membership, edited: false }
  ]
)

# Vacation policy: Sarah authored, Priya reviewed (she manages PTO requests)
seed_editing_sessions(
  document: vacation_doc, author_membership: sarah_membership, timeline: t,
  participants: [
    { member: priya_membership, edited: false }
  ]
)

# Travel reimbursement: Sarah authored alone
seed_editing_sessions(
  document: travel_doc, author_membership: sarah_membership, timeline: t,
  participants: []
)

# Out of office: Sarah authored, Elena contributed (added scheduling details)
seed_editing_sessions(
  document: ooo_doc, author_membership: sarah_membership, timeline: t,
  participants: [
    { member: elena_membership, edited: true }
  ]
)

# Onboarding checklist: Sarah authored, James contributed, Alex recently viewed
seed_editing_sessions(
  document: onboarding_doc, author_membership: sarah_membership, timeline: t,
  participants: [
    { member: james_membership, edited: true },
    { member: alex_membership, edited: false }
  ]
)

# Meeting notes: Sarah authored, everyone attended and viewed
seed_editing_sessions(
  document: meeting_doc, author_membership: sarah_membership, timeline: t,
  participants: [
    { member: james_membership, edited: false },
    { member: priya_membership, edited: false },
    { member: marcus_membership, edited: false },
    { member: elena_membership, edited: false },
    { member: alex_membership, edited: false }
  ]
)

# Client Projects documents

# GreenLeaf GTM: James authored, Priya and Sarah reviewed
seed_editing_sessions(
  document: gtm_doc, author_membership: james_membership, timeline: t,
  participants: [
    { member: priya_membership, edited: false },
    { member: sarah_membership, edited: false }
  ]
)

# GreenLeaf Q1 Brief: James authored, Elena and Marcus contributed
seed_editing_sessions(
  document: campaign_brief_doc, author_membership: james_membership, timeline: t,
  participants: [
    { member: elena_membership, edited: true },
    { member: marcus_membership, edited: true }
  ]
)

# UrbanFit Brand Voice: Priya authored, James reviewed
seed_editing_sessions(
  document: brand_voice_doc, author_membership: priya_membership, timeline: t,
  participants: [
    { member: james_membership, edited: false }
  ]
)

# UrbanFit Instagram: Elena authored, Marcus contributed visuals
seed_editing_sessions(
  document: instagram_doc, author_membership: elena_membership, timeline: t,
  participants: [
    { member: marcus_membership, edited: true }
  ]
)

# TechNova Proposal: James authored, Sarah and Priya reviewed — active collaboration
seed_editing_sessions(
  document: technova_doc, author_membership: james_membership, timeline: t,
  participants: [
    { member: sarah_membership, edited: true },
    { member: priya_membership, edited: false }
  ]
)

# Creative Lab documents

# Content Calendar Template: Elena authored, Marcus reviewed
seed_editing_sessions(
  document: calendar_template_doc, author_membership: elena_membership, timeline: t,
  participants: [
    { member: marcus_membership, edited: false }
  ]
)

# Campaign Brainstorm: James led, Marcus/Elena/Priya all contributed — collaborative session
seed_editing_sessions(
  document: brainstorm_doc, author_membership: james_membership, timeline: t,
  participants: [
    { member: marcus_membership, edited: true },
    { member: elena_membership, edited: true },
    { member: priya_membership, edited: true }
  ]
)

# Design System: Marcus authored, James reviewed
seed_editing_sessions(
  document: design_doc, author_membership: marcus_membership, timeline: t,
  participants: [
    { member: james_membership, edited: false }
  ]
)

puts "=== Done: BrightPath Media ===\n\n"
