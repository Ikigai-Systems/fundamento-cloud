require "rails_helper"

# What the BackfillDocumentBlocks migration runs, for versions saved before the index existed.
RSpec.describe DocumentBlockBackfill do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:with_comment) { documents(:one) }
  let(:without_comment) { documents(:two) }

  def paragraph(id)
    {"id" => id, "type" => "paragraph", "content" => [], "children" => []}
  end

  def save_versions(document)
    first = document.versions.create!(created_by: users(:pawel), content_blocks: [paragraph("gone"), paragraph("kept")])
    second = document.versions.create!(created_by: users(:pawel), content_blocks: [paragraph("kept")])
    [first, second]
  end

  before do
    @first_a, @second_a = save_versions(with_comment)
    _, @second_b = save_versions(without_comment)

    with_comment.comments.create!(
      organization: organizations(:is),
      organization_membership: organization_memberships(:om_is_pawel),
      content: [{"type" => "paragraph", "content" => []}],
      anchor_block_id: "gone"
    )
    DocumentBlock.delete_all
  end

  def marks(document)
    DocumentBlock.where(document_id: document.id).pluck(:block_id, :last_version_id).to_h
  end

  it "records every version of a document with comments on blocks, so a removed block keeps its version" do
    described_class.run

    expect(marks(with_comment)).to eq("gone" => @first_a.id, "kept" => @second_a.id)
  end

  it "records only the latest version of a document without them" do
    described_class.run

    expect(marks(without_comment)).to eq("kept" => @second_b.id)
  end

  it "can run again" do
    described_class.run

    expect { described_class.run }.not_to change { DocumentBlock.pluck(:document_id, :block_id, :last_version_id).sort }
  end
end
