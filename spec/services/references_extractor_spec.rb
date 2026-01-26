require "rails_helper"

RSpec.describe ReferencesExtractor do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:user) { users(:pawel) }

  describe ".all_references" do
    context "extracting references from document versions" do
      let(:document) { documents(:one) }
      let(:referenced_doc_id) { "doc123" }
      let(:referenced_table_id) { "table456" }

      let(:content_with_mentions) do
        [
          {
            "id" => "block1",
            "type" => "paragraph",
            "content" => [
              { "type" => "text", "text" => "Check out " },
              {
                "type" => "mention",
                "props" => {
                  "id" => "mention1",
                  "entity" => "document",
                  "entityId" => referenced_doc_id
                }
              },
              { "type" => "text", "text" => " and " },
              {
                "type" => "mention",
                "props" => {
                  "id" => "mention2",
                  "entity" => "table",
                  "entityId" => referenced_table_id
                }
              }
            ]
          }
        ]
      end

      before do
        @version = Version.create!(
          document: document,
          content_blocks: content_with_mentions,
          created_by: user
        )
      end

      it "extracts document mentions from version content" do
        references = ReferencesExtractor.all_references([document])

        doc_refs = references.select { |r| r.referenced_type == "Document" }
        expect(doc_refs.length).to eq(1)
        expect(doc_refs.first.referenced_id).to eq(referenced_doc_id)
        expect(doc_refs.first.referenced_by).to eq(document)
      end

      it "extracts table mentions from version content" do
        references = ReferencesExtractor.all_references([document])

        table_refs = references.select { |r| r.referenced_type == "Table" }
        expect(table_refs.length).to eq(1)
        expect(table_refs.first.referenced_id).to eq(referenced_table_id)
        expect(table_refs.first.referenced_by).to eq(document)
      end

      it "returns ObjectReference structs" do
        references = ReferencesExtractor.all_references([document])

        expect(references).to all(be_an(ObjectReference))
        expect(references.first).to respond_to(:referenced_type)
        expect(references.first).to respond_to(:referenced_id)
        expect(references.first).to respond_to(:referenced_by)
        expect(references.first).to respond_to(:referenced_path)
        expect(references.first).to respond_to(:referenced_title)
      end
    end

    context "extracting references from advancedTable blocks" do
      let(:document) { documents(:one) }
      let(:table_npi) { "table789" }

      let(:content_with_advanced_table) do
        [
          {
            "id" => "block1",
            "type" => "advancedTable",
            "props" => {
              "tableNpi" => table_npi,
              "viewId" => "view1"
            }
          }
        ]
      end

      before do
        @version = Version.create!(
          document: document,
          content_blocks: content_with_advanced_table,
          created_by: user
        )
      end

      it "extracts table references from advancedTable blocks using tableNpi" do
        references = ReferencesExtractor.all_references([document])

        table_refs = references.select { |r| r.referenced_type == "Table" }
        expect(table_refs.length).to eq(1)
        expect(table_refs.first.referenced_id).to eq(table_npi)
        expect(table_refs.first.referenced_by).to eq(document)
      end
    end

    context "extracting references from advancedTable blocks with legacy tableId" do
      let(:document) { documents(:one) }
      let(:table_id) { "oldtableid" }

      let(:content_with_legacy_table) do
        [
          {
            "id" => "block1",
            "type" => "advancedTable",
            "props" => {
              "tableId" => table_id,
              "viewId" => "view1"
            }
          }
        ]
      end

      before do
        @version = Version.create!(
          document: document,
          content_blocks: content_with_legacy_table,
          created_by: user
        )
      end

      it "extracts table references from advancedTable blocks using tableId fallback" do
        references = ReferencesExtractor.all_references([document])

        table_refs = references.select { |r| r.referenced_type == "Table" }
        expect(table_refs.length).to eq(1)
        expect(table_refs.first.referenced_id).to eq(table_id)
      end
    end

    context "extracting references from document comments" do
      let(:document) { documents(:one) }
      let(:referenced_doc_id) { "commentdoc" }
      let(:org_membership) { organization_memberships(:om_is_pawel) }

      let(:comment_content) do
        [
          {
            "id" => "block1",
            "type" => "paragraph",
            "content" => [
              { "type" => "text", "text" => "See " },
              {
                "type" => "mention",
                "props" => {
                  "id" => "mention1",
                  "entity" => "document",
                  "entityId" => referenced_doc_id
                }
              }
            ]
          }
        ]
      end

      before do
        @comment = ObjectComment.create!(
          object: document,
          organization: organization,
          organization_membership: org_membership,
          content: comment_content
        )
      end

      it "extracts references from comment content" do
        references = ReferencesExtractor.all_references([document])

        doc_refs = references.select { |r| r.referenced_type == "Document" }
        expect(doc_refs.length).to eq(1)
        expect(doc_refs.first.referenced_id).to eq(referenced_doc_id)
        expect(doc_refs.first.referenced_by).to eq(document)
      end
    end

    context "handling nested blocks" do
      let(:document) { documents(:one) }
      let(:nested_doc_id) { "nested123" }

      let(:nested_content) do
        [
          {
            "id" => "block1",
            "type" => "paragraph",
            "content" => [
              {
                "type" => "text",
                "text" => "Parent block"
              }
            ],
            "children" => [
              {
                "id" => "block2",
                "type" => "paragraph",
                "content" => [
                  {
                    "type" => "mention",
                    "props" => {
                      "id" => "mention1",
                      "entity" => "document",
                      "entityId" => nested_doc_id
                    }
                  }
                ]
              }
            ]
          }
        ]
      end

      before do
        @version = Version.create!(
          document: document,
          content_blocks: nested_content,
          created_by: user
        )
      end

      it "extracts references from nested blocks" do
        references = ReferencesExtractor.all_references([document])

        doc_refs = references.select { |r| r.referenced_type == "Document" }
        expect(doc_refs.length).to eq(1)
        expect(doc_refs.first.referenced_id).to eq(nested_doc_id)
      end
    end

    context "de-duplicating references" do
      let(:document) { documents(:one) }
      let(:doc_id) { "duplicate123" }
      let(:org_membership) { organization_memberships(:om_is_pawel) }

      let(:content_with_duplicate) do
        [
          {
            "id" => "block1",
            "type" => "paragraph",
            "content" => [
              {
                "type" => "mention",
                "props" => {
                  "id" => "mention1",
                  "entity" => "document",
                  "entityId" => doc_id
                }
              },
              {
                "type" => "mention",
                "props" => {
                  "id" => "mention2",
                  "entity" => "document",
                  "entityId" => doc_id
                }
              }
            ]
          }
        ]
      end

      before do
        # Create version with duplicate mentions
        @version = Version.create!(
          document: document,
          content_blocks: content_with_duplicate,
          created_by: user
        )

        # Create comment with same mention
        @comment = ObjectComment.create!(
          object: document,
          organization: organization,
          organization_membership: org_membership,
          content: content_with_duplicate
        )
      end

      it "returns only one reference per unique (document, object_type, object_id) combination" do
        references = ReferencesExtractor.all_references([document])

        doc_refs = references.select { |r| r.referenced_type == "Document" && r.referenced_id == doc_id }
        expect(doc_refs.length).to eq(1)
      end

      it "de-duplicates mentions within the same version" do
        references = ReferencesExtractor.all_references([document])

        doc_refs = references.select { |r| r.referenced_type == "Document" && r.referenced_id == doc_id }
        expect(doc_refs.length).to eq(1)
        expect(doc_refs.first.referenced_by).to eq(document)
      end

      it "de-duplicates mentions across versions and comments" do
        # The version already has 2 mentions of the same doc, and the comment has 2 more
        # All should be de-duplicated to a single reference
        references = ReferencesExtractor.all_references([document])

        doc_refs = references.select { |r| r.referenced_type == "Document" && r.referenced_id == doc_id }
        expect(doc_refs.length).to eq(1)
      end
    end

    context "handling multiple documents" do
      let(:doc1) { documents(:one) }
      let(:doc2) do
        Document.create!(
          organization: organization,
          space: space,
          title: "Second Document"
        )
      end
      let(:ref_id) { "shared123" }

      let(:content_with_mention) do
        [
          {
            "id" => "block1",
            "type" => "paragraph",
            "content" => [
              {
                "type" => "mention",
                "props" => {
                  "id" => "mention1",
                  "entity" => "document",
                  "entityId" => ref_id
                }
              }
            ]
          }
        ]
      end

      before do
        Version.create!(
          document: doc1,
          content_blocks: content_with_mention,
          created_by: user
        )
        Version.create!(
          document: doc2,
          content_blocks: content_with_mention,
          created_by: user
        )
      end

      it "extracts references from all provided documents" do
        references = ReferencesExtractor.all_references([doc1, doc2])

        doc_refs = references.select { |r| r.referenced_type == "Document" && r.referenced_id == ref_id }
        expect(doc_refs.length).to eq(2)

        referenced_by_docs = doc_refs.map(&:referenced_by)
        expect(referenced_by_docs).to contain_exactly(doc1, doc2)
      end
    end

    context "edge cases" do
      let(:document) { documents(:one) }

      it "returns empty array for documents with no versions" do
        references = ReferencesExtractor.all_references([document])
        expect(references).to eq([])
      end

      it "returns empty array for empty document array" do
        references = ReferencesExtractor.all_references([])
        expect(references).to eq([])
      end

      it "handles empty content_blocks" do
        Version.create!(
          document: document,
          content_blocks: [],
          created_by: user
        )

        references = ReferencesExtractor.all_references([document])
        expect(references).to eq([])
      end

      it "handles content with no mentions" do
        Version.create!(
          document: document,
          content_blocks: [
            {
              "id" => "block1",
              "type" => "paragraph",
              "content" => [
                { "type" => "text", "text" => "Just plain text" }
              ]
            }
          ],
          created_by: user
        )

        references = ReferencesExtractor.all_references([document])
        expect(references).to eq([])
      end

      it "skips mentions with blank object_id" do
        Version.create!(
          document: document,
          content_blocks: [
            {
              "id" => "block1",
              "type" => "paragraph",
              "content" => [
                {
                  "type" => "mention",
                  "props" => {
                    "id" => "mention1",
                    "entity" => "document",
                    "entityId" => ""
                  }
                }
              ]
            }
          ],
          created_by: user
        )

        references = ReferencesExtractor.all_references([document])
        expect(references).to eq([])
      end

      it "skips mentions with nil object_id" do
        Version.create!(
          document: document,
          content_blocks: [
            {
              "id" => "block1",
              "type" => "paragraph",
              "content" => [
                {
                  "type" => "mention",
                  "props" => {
                    "id" => "mention1",
                    "entity" => "document",
                    "entityId" => nil
                  }
                }
              ]
            }
          ],
          created_by: user
        )

        references = ReferencesExtractor.all_references([document])
        expect(references).to eq([])
      end

      it "skips advancedTable blocks with blank table IDs" do
        Version.create!(
          document: document,
          content_blocks: [
            {
              "id" => "block1",
              "type" => "advancedTable",
              "props" => {
                "tableNpi" => "",
                "tableId" => ""
              }
            }
          ],
          created_by: user
        )

        references = ReferencesExtractor.all_references([document])
        expect(references).to eq([])
      end

      it "ignores mentions of unsupported entity types" do
        Version.create!(
          document: document,
          content_blocks: [
            {
              "id" => "block1",
              "type" => "paragraph",
              "content" => [
                {
                  "type" => "mention",
                  "props" => {
                    "id" => "mention1",
                    "entity" => "user",
                    "entityId" => "user123"
                  }
                }
              ]
            }
          ],
          created_by: user
        )

        references = ReferencesExtractor.all_references([document])
        expect(references).to eq([])
      end
    end

    context "only uses latest version" do
      let(:document) { documents(:one) }
      let(:old_ref_id) { "old123" }
      let(:new_ref_id) { "new456" }

      before do
        # Create older version
        Version.create!(
          document: document,
          content_blocks: [
            {
              "id" => "block1",
              "type" => "paragraph",
              "content" => [
                {
                  "type" => "mention",
                  "props" => {
                    "id" => "mention1",
                    "entity" => "document",
                    "entityId" => old_ref_id
                  }
                }
              ]
            }
          ],
          created_by: user
        )

        # Wait a tiny bit to ensure different timestamps
        sleep(0.01)

        # Create newer version
        Version.create!(
          document: document,
          content_blocks: [
            {
              "id" => "block1",
              "type" => "paragraph",
              "content" => [
                {
                  "type" => "mention",
                  "props" => {
                    "id" => "mention2",
                    "entity" => "document",
                    "entityId" => new_ref_id
                  }
                }
              ]
            }
          ],
          created_by: user
        )
      end

      it "extracts references only from the latest version" do
        references = ReferencesExtractor.all_references([document])

        doc_refs = references.select { |r| r.referenced_type == "Document" }
        expect(doc_refs.length).to eq(1)
        expect(doc_refs.first.referenced_id).to eq(new_ref_id)
      end
    end

    context "case sensitivity in entity types" do
      let(:document) { documents(:one) }

      it "handles entity=document (lowercase)" do
        Version.create!(
          document: document,
          content_blocks: [
            {
              "id" => "block1",
              "type" => "paragraph",
              "content" => [
                {
                  "type" => "mention",
                  "props" => {
                    "id" => "mention1",
                    "entity" => "document",
                    "entityId" => "doc123"
                  }
                }
              ]
            }
          ],
          created_by: user
        )

        references = ReferencesExtractor.all_references([document])
        expect(references.first.referenced_type).to eq("Document")
      end

      it "handles entity=table (lowercase)" do
        Version.create!(
          document: document,
          content_blocks: [
            {
              "id" => "block1",
              "type" => "paragraph",
              "content" => [
                {
                  "type" => "mention",
                  "props" => {
                    "id" => "mention1",
                    "entity" => "table",
                    "entityId" => "table123"
                  }
                }
              ]
            }
          ],
          created_by: user
        )

        references = ReferencesExtractor.all_references([document])
        expect(references.first.referenced_type).to eq("Table")
      end
    end
  end

  describe "ObjectReference" do
    it "has emoji extraction capability" do
      ref = ObjectReference.new(
        referenced_type: "Document",
        referenced_id: "doc123",
        referenced_by: nil,
        referenced_path: "/documents/doc123",
        referenced_title: "📝 My Document"
      )

      expect(ref).to respond_to(:referenced_title_emoji)
      expect(ref).to respond_to(:referenced_title_emojiless)
      expect(ref.referenced_title_emoji).to eq("📝")
      expect(ref.referenced_title_emojiless).to eq("My Document")
    end
  end
end
