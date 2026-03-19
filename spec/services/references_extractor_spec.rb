require "rails_helper"

RSpec.describe ReferencesExtractor do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents, "tables/tables"

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:user) { users(:pawel) }

  # Generate unique IDs for mention props to avoid clashes with ObjectReferenceReconciler
  def unique_id(prefix = "id")
    "#{prefix}_#{SecureRandom.hex(6)}"
  end

  describe ".all_references" do
    shared_examples "all_references behavior" do
      context "extracting references from document versions" do
        let(:document) { documents(:one) }
        let(:referenced_doc) { documents(:two) }
        let(:referenced_table) { tables_tables(:users) }

        let(:content_with_mentions) do
          [
            {
              "id" => unique_id("block"),
              "type" => "paragraph",
              "content" => [
                { "type" => "text", "text" => "Check out " },
                {
                  "type" => "mention",
                  "props" => {
                    "id" => unique_id("mention"),
                    "entity" => "document",
                    "entityId" => referenced_doc.id
                  }
                },
                { "type" => "text", "text" => " and " },
                {
                  "type" => "mention",
                  "props" => {
                    "id" => unique_id("mention"),
                    "entity" => "table",
                    "entityId" => referenced_table.id
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
          expect(doc_refs.first.referenced_id).to eq(referenced_doc.id)
          expect(doc_refs.first.referenced_by).to eq(document)
        end

        it "extracts table mentions from version content" do
          references = ReferencesExtractor.all_references([document])

          table_refs = references.select { |r| r.referenced_type == "Table" }
          expect(table_refs.length).to eq(1)
          expect(table_refs.first.referenced_id).to eq(referenced_table.id)
          expect(table_refs.first.referenced_by).to eq(document)
        end

        it "returns DocumentReference structs" do
          references = ReferencesExtractor.all_references([document])

          expect(references).to all(be_an(DocumentReference))
          expect(references.first).to respond_to(:referenced_type)
          expect(references.first).to respond_to(:referenced_id)
          expect(references.first).to respond_to(:referenced_by)
          expect(references.first).to respond_to(:referenced_path)
          expect(references.first).to respond_to(:referenced_title)
        end
      end

      context "extracting references from advancedTable blocks" do
        let(:document) { documents(:one) }
        let(:referenced_table) { tables_tables(:projects) }

        let(:content_with_advanced_table) do
          [
            {
              "id" => unique_id("block"),
              "type" => "advancedTable",
              "props" => {
                "tableNpi" => referenced_table.id,
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
          expect(table_refs.first.referenced_id).to eq(referenced_table.id)
          expect(table_refs.first.referenced_by).to eq(document)
        end
      end

      context "extracting references from advancedTable blocks with legacy tableId" do
        let(:document) { documents(:one) }
        let(:referenced_table) { tables_tables(:orders) }

        let(:content_with_legacy_table) do
          [
            {
              "id" => unique_id("block"),
              "type" => "advancedTable",
              "props" => {
                "tableId" => referenced_table.id,
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
          expect(table_refs.first.referenced_id).to eq(referenced_table.id)
        end
      end

      context "extracting references from document comments" do
        let(:document) { documents(:one) }
        let(:referenced_doc) { documents(:two) }
        let(:org_membership) { organization_memberships(:om_is_pawel) }

        let(:comment_content) do
          [
            {
              "id" => unique_id("block"),
              "type" => "paragraph",
              "content" => [
                { "type" => "text", "text" => "See " },
                {
                  "type" => "mention",
                  "props" => {
                    "id" => unique_id("mention"),
                    "entity" => "document",
                    "entityId" => referenced_doc.id
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
          expect(doc_refs.first.referenced_id).to eq(referenced_doc.id)
          expect(doc_refs.first.referenced_by).to eq(document)
        end
      end

      context "handling nested blocks" do
        let(:document) { documents(:one) }
        let(:nested_doc) { documents(:two) }

        let(:nested_content) do
          [
            {
              "id" => unique_id("block"),
              "type" => "paragraph",
              "content" => [
                {
                  "type" => "text",
                  "text" => "Parent block"
                }
              ],
              "children" => [
                {
                  "id" => unique_id("block"),
                  "type" => "paragraph",
                  "content" => [
                    {
                      "type" => "mention",
                      "props" => {
                        "id" => unique_id("mention"),
                        "entity" => "document",
                        "entityId" => nested_doc.id
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
          expect(doc_refs.first.referenced_id).to eq(nested_doc.id)
        end
      end

      context "de-duplicating references" do
        let(:document) { documents(:one) }
        let(:referenced_doc) { documents(:two) }
        let(:org_membership) { organization_memberships(:om_is_pawel) }

        def content_mentioning(doc_id)
          [
            {
              "id" => unique_id("block"),
              "type" => "paragraph",
              "content" => [
                {
                  "type" => "mention",
                  "props" => {
                    "id" => unique_id("mention"),
                    "entity" => "document",
                    "entityId" => doc_id
                  }
                },
                {
                  "type" => "mention",
                  "props" => {
                    "id" => unique_id("mention"),
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
            content_blocks: content_mentioning(referenced_doc.id),
            created_by: user
          )

          # Create comment with same target but different mention IDs
          @comment = ObjectComment.create!(
            object: document,
            organization: organization,
            organization_membership: org_membership,
            content: content_mentioning(referenced_doc.id)
          )
        end

        it "returns only one reference per unique (document, object_type, object_id) combination" do
          references = ReferencesExtractor.all_references([document])

          doc_refs = references.select { |r| r.referenced_type == "Document" && r.referenced_id == referenced_doc.id }
          expect(doc_refs.length).to eq(1)
        end

        it "de-duplicates mentions within the same version" do
          references = ReferencesExtractor.all_references([document])

          doc_refs = references.select { |r| r.referenced_type == "Document" && r.referenced_id == referenced_doc.id }
          expect(doc_refs.length).to eq(1)
          expect(doc_refs.first.referenced_by).to eq(document)
        end

        it "de-duplicates mentions across versions and comments" do
          # The version already has 2 mentions of the same doc, and the comment has 2 more
          # All should be de-duplicated to a single reference
          references = ReferencesExtractor.all_references([document])

          doc_refs = references.select { |r| r.referenced_type == "Document" && r.referenced_id == referenced_doc.id }
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
        let(:referenced_doc) { documents(:two) }

        def content_with_mention
          [
            {
              "id" => unique_id("block"),
              "type" => "paragraph",
              "content" => [
                {
                  "type" => "mention",
                  "props" => {
                    "id" => unique_id("mention"),
                    "entity" => "document",
                    "entityId" => referenced_doc.id
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

          doc_refs = references.select { |r| r.referenced_type == "Document" && r.referenced_id == referenced_doc.id }
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
                "id" => unique_id("block"),
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
                "id" => unique_id("block"),
                "type" => "paragraph",
                "content" => [
                  {
                    "type" => "mention",
                    "props" => {
                      "id" => unique_id("mention"),
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
                "id" => unique_id("block"),
                "type" => "paragraph",
                "content" => [
                  {
                    "type" => "mention",
                    "props" => {
                      "id" => unique_id("mention"),
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
                "id" => unique_id("block"),
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
                "id" => unique_id("block"),
                "type" => "paragraph",
                "content" => [
                  {
                    "type" => "mention",
                    "props" => {
                      "id" => unique_id("mention"),
                      "entity" => "user",
                      "entityId" => users(:pawel).id
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
        let(:old_ref) { documents(:two) }
        let(:new_ref) { tables_tables(:users) }

        before do
          # Create older version
          Version.create!(
            document: document,
            content_blocks: [
              {
                "id" => unique_id("block"),
                "type" => "paragraph",
                "content" => [
                  {
                    "type" => "mention",
                    "props" => {
                      "id" => unique_id("mention"),
                      "entity" => "document",
                      "entityId" => old_ref.id
                    }
                  }
                ]
              }
            ],
            created_by: user
          )

          # Wait a tiny bit to ensure different timestamps
          sleep(0.01)

          # Create newer version with a table mention instead
          Version.create!(
            document: document,
            content_blocks: [
              {
                "id" => unique_id("block"),
                "type" => "paragraph",
                "content" => [
                  {
                    "type" => "mention",
                    "props" => {
                      "id" => unique_id("mention"),
                      "entity" => "table",
                      "entityId" => new_ref.id
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

          expect(references.length).to eq(1)
          expect(references.first.referenced_type).to eq("Table")
          expect(references.first.referenced_id).to eq(new_ref.id)
        end
      end

      context "case sensitivity in entity types" do
        let(:document) { documents(:one) }

        it "handles entity=document (lowercase)" do
          Version.create!(
            document: document,
            content_blocks: [
              {
                "id" => unique_id("block"),
                "type" => "paragraph",
                "content" => [
                  {
                    "type" => "mention",
                    "props" => {
                      "id" => unique_id("mention"),
                      "entity" => "document",
                      "entityId" => documents(:two).id
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
                "id" => unique_id("block"),
                "type" => "paragraph",
                "content" => [
                  {
                    "type" => "mention",
                    "props" => {
                      "id" => unique_id("mention"),
                      "entity" => "table",
                      "entityId" => tables_tables(:users).id
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

    context "with object_reference_extractors flag disabled (from_blocknote)" do
      before { Flipper.disable(:object_reference_extractors) }

      include_examples "all_references behavior"
    end

    context "with object_reference_extractors flag enabled (from_object_references)" do
      before { Flipper.enable(:object_reference_extractors) }

      include_examples "all_references behavior"

      it "uses documents collection for referenced_by (object identity)" do
        doc = documents(:one)
        docs = [doc]
        Version.create!(
          document: doc,
          content_blocks: [
            {
              "id" => unique_id("block"),
              "type" => "paragraph",
              "content" => [
                {
                  "type" => "mention",
                  "props" => {
                    "id" => unique_id("mention"),
                    "entity" => "document",
                    "entityId" => documents(:two).id
                  }
                }
              ]
            }
          ],
          created_by: users(:pawel)
        )

        references = described_class.all_references(docs)
        expect(references.first.referenced_by).to equal(doc)
      end
    end
  end

  describe "DocumentReference" do
    it "has emoji extraction capability" do
      ref = DocumentReference.new(
        referenced_type: "Document",
        referenced_id: "doc123",
        referenced_by: nil,
        referenced_path: "/documents/doc123",
        referenced_title: "\u{1F4DD} My Document"
      )

      expect(ref).to respond_to(:referenced_title_emoji)
      expect(ref).to respond_to(:referenced_title_emojiless)
      expect(ref.referenced_title_emoji).to eq("\u{1F4DD}")
      expect(ref.referenced_title_emojiless).to eq("My Document")
    end
  end
end
