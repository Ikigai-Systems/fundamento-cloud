require "rails_helper"
require "rake"

RSpec.describe "attachments:migrate_to_active_storage", type: :task do
  fixtures :organizations, :spaces, :documents

  let(:organization) { organizations(:is) }
  let(:document) { documents(:one) }

  before do
    # Load rake tasks
    Rails.application.load_tasks if Rake::Task.tasks.empty?
  end

  describe "idempotency" do
    it "skips attachments that already have Active Storage files" do
      # Create attachment with Active Storage file only (simulating already migrated)
      attachment = Attachment.create!(
        organization: organization,
        parent: document,
        filename: "test.txt",
        mime_type: "text/plain"
      )
      attachment.file.attach(
        io: StringIO.new("Active Storage content"),
        filename: "test.txt",
        content_type: "text/plain"
      )

      # Run task - should skip this attachment
      output = capture_output do
        Rake::Task["attachments:migrate_to_active_storage"].execute
      end

      expect(output).to include("already migrated")
    end

    it "migrates attachment with database storage only" do
      # Create attachment with database storage only
      attachment = Attachment.create!(
        organization: organization,
        parent: document,
        filename: "test.txt",
        mime_type: "text/plain",
        data: "Database content"
      )

      expect(attachment.stored_in_database?).to be true
      expect(attachment.stored_in_active_storage?).to be false

      # Run migration
      output = capture_output do
        Rake::Task["attachments:migrate_to_active_storage"].execute
      end

      # Verify migration occurred
      attachment.reload
      expect(attachment.stored_in_active_storage?).to be true
      expect(attachment.file.download).to eq("Database content")
      expect(output).to include("✓")
    end

    it "can be run multiple times safely (idempotent)" do
      # Create attachment
      attachment = Attachment.create!(
        organization: organization,
        parent: document,
        filename: "test.txt",
        mime_type: "text/plain",
        data: "Test content"
      )

      # Run migration first time
      output1 = capture_output do
        Rake::Task["attachments:migrate_to_active_storage"].reenable
        Rake::Task["attachments:migrate_to_active_storage"].execute
      end

      attachment.reload
      expect(attachment.stored_in_active_storage?).to be true
      first_blob_id = attachment.file.blob.id

      # Run migration second time - should skip
      output2 = capture_output do
        Rake::Task["attachments:migrate_to_active_storage"].reenable
        Rake::Task["attachments:migrate_to_active_storage"].execute
      end

      attachment.reload
      expect(attachment.stored_in_active_storage?).to be true
      expect(attachment.file.blob.id).to eq(first_blob_id) # Same blob, not duplicated
      expect(output2).to include("already migrated")
    end
  end

  describe "error handling" do
    it "skips attachments with missing filename" do
      attachment = Attachment.create!(
        organization: organization,
        parent: document,
        filename: nil,
        mime_type: "text/plain",
        data: "Content"
      )

      output = capture_output do
        Rake::Task["attachments:migrate_to_active_storage"].reenable
        Rake::Task["attachments:migrate_to_active_storage"].execute
      end

      attachment.reload
      expect(attachment.stored_in_active_storage?).to be false
      expect(output).to include("missing filename")
    end

    it "skips attachments with no database data" do
      attachment = Attachment.create!(
        organization: organization,
        parent: document,
        filename: "test.txt",
        mime_type: "text/plain",
        data: nil
      )

      output = capture_output do
        Rake::Task["attachments:migrate_to_active_storage"].reenable
        Rake::Task["attachments:migrate_to_active_storage"].execute
      end

      expect(output).to include("already migrated")
    end
  end

  private

  def capture_output
    original_stdout = $stdout
    $stdout = StringIO.new
    yield
    $stdout.string
  ensure
    $stdout = original_stdout
  end
end
