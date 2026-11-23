require "rails_helper"

RSpec.describe DocumentBlockReconciler do
  fixtures :organizations, :users, :spaces, :documents

  let(:document) { documents(:one) }

  def paragraph(id, children: [])
    {"id" => id, "type" => "paragraph", "content" => [], "children" => children}
  end

  def save_version(*blocks)
    document.versions.create!(created_by: users(:pawel), content_blocks: blocks)
  end

  def marks
    DocumentBlock.where(document_id: document.id).pluck(:block_id, :last_version_id).to_h
  end

  it "marks every block of a saved version with it, nested ones included" do
    version = save_version(paragraph("a", children: [paragraph("b")]), paragraph("c"))

    expect(marks).to eq("a" => version.id, "b" => version.id, "c" => version.id)
  end

  it "moves the mark of the blocks a later version has, and leaves those it no longer has" do
    first = save_version(paragraph("a"), paragraph("b"))
    second = save_version(paragraph("a"))

    expect(marks).to eq("a" => second.id, "b" => first.id)
  end

  it "does not move a mark back to an older version" do
    first = save_version(paragraph("a"))
    second = save_version(paragraph("a"))

    described_class.reconcile(document, first)

    expect(marks).to eq("a" => second.id)
  end

  it "records nothing for a version without blocks" do
    save_version

    expect(marks).to be_empty
  end
end
