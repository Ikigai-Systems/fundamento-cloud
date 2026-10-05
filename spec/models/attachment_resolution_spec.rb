require "rails_helper"

# The stable-identity rewrite commits as it goes so it can be resumed, which means a
# part-rewritten state is reachable: one document references the integer id it was written with,
# the next references the npi the rewrite moved it to. Both have to resolve, or half the
# documents show broken attachments until the rewrite finishes.
#
# The schema here has the migration already applied, so the transitional shape is recreated to
# test it. Each example runs inside DatabaseCleaner's transaction, so the added column rolls
# back with everything else; only Rails' column cache needs clearing by hand.
RSpec.describe "resolving an attachment during the id transition" do
  fixtures :organizations, :documents, :spaces, :attachments

  let(:attachment) { attachments(:one) }

  describe "while the npi column exists" do
    let(:npi) { "b3d3f6b9-9268-48d5-a12a-9db03b251c88" }

    before do
      ActiveRecord::Base.connection.add_column(:attachments, :npi, :string)
      Attachment.reset_column_information
      attachment.update_column(:npi, npi)
    end

    after { Attachment.reset_column_information }

    it "knows it is mid-transition" do
      expect(Attachment.in_transition?).to be(true)
    end

    it "resolves by the npi a rewritten document holds" do
      expect(Attachment.resolve!(npi)).to eq(attachment)
    end

    it "still resolves by the id an unrewritten document holds" do
      expect(Attachment.resolve!(attachment.id)).to eq(attachment)
    end

    it "honours the scope it is given" do
      expect { Attachment.resolve!(npi, scope: organizations(:hc).attachments) }
        .to raise_error(ActiveRecord::RecordNotFound)
    end

    it "raises for an identifier that is neither" do
      expect { Attachment.resolve!("not-an-attachment") }
        .to raise_error(ActiveRecord::RecordNotFound, /id or npi/)
    end
  end

  describe "once the transition is over" do
    it "is a plain lookup" do
      expect(Attachment.in_transition?).to be(false)
      expect(Attachment.resolve!(attachment.id)).to eq(attachment)
      expect { Attachment.resolve!("gone") }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end
end
