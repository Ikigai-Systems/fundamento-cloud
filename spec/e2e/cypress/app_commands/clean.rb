if defined?(DatabaseCleaner)
  # cleaning the database using database_cleaner
  DatabaseCleaner.strategy = :truncation
  DatabaseCleaner.clean
else
  logger.warn "add database_cleaner or update cypress/app_commands/clean.rb"
  Post.delete_all if defined?(Post)
end

# Give this test its own IndexedDB namespace.
#
# The editor persists each document's Y.js state in the browser under
# databases/<database_id>/documents/<document_id> (see Editor.tsx), and Cypress does not clear
# IndexedDB between tests. database_id lives in ar_internal_metadata, which DatabaseCleaner
# excludes from truncation, so it was the same for every test in a file -- and fixture documents
# reuse their ids. One test's editor content therefore merged into the next one's.
#
# That was invisible for as long as integer primary keys made the leaked content identical:
# truncation runs `RESTART IDENTITY`, so every test's first attachment was id 1 and a stale
# `attachment:1` link matched the new one exactly. Giving those tables nanoid primary keys made
# each test's ids unique, and the leak surfaced as four failures in
# document-attachment-links.cy.js.
#
# Rotating the id is cheaper than clearing IndexedDB from Cypress, and it covers every editor
# spec rather than the one that happened to notice.
ActiveRecord::InternalMetadata.new(ActiveRecord::Base.connection_pool)[:database_id] =
  Nanoid.generate(size: 10)

CypressOnRails::SmartFactoryWrapper.reload

if defined?(VCR)
  VCR.eject_cassette # make sure we no cassette inserted before the next test starts
  VCR.turn_off!
  WebMock.disable! if defined?(WebMock)
end

Rails.logger.info "APPCLEANED" # used by log_fail.rb
