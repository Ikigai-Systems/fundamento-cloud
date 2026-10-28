require "rails_helper"

RSpec.describe DocumentService do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :documents, :object_contents

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:service) { described_class.new(pundit_user: PolicyUserContext.new(user, organization)) }

  before do
    allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
    allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("sync")
  end

  def with_frontmatter(lines)
    "---\n#{lines}\n---\n\nBody"
  end

  describe "frontmatter color and icon" do
    describe "#create!" do
      def create(markdown, **options)
        service.create!(space_id: space.id, title: "Note", markdown: markdown, **options)
      end

      it "applies fundamento/color and fundamento/icon" do
        document = create(file_fixture("documents/with_fundamento_frontmatter.md").read)

        expect(document.reload.color).to eq("indigo")
        expect(document.icon).to eq(Icon.emoji("🔥"))
      end

      it "drops invalid values without failing" do
        document = create(with_frontmatter("fundamento/color: 3\nfundamento/icon: fire"))

        expect(document.reload.color).to be_nil
        expect(document.icon).to be_nil
      end

      it "ignores a bare color: and icon: key" do
        document = create(with_frontmatter("color: blue\nicon: \"🔥\""))

        expect(document.reload.color).to be_nil
        expect(document.icon).to be_nil
      end

      it "lets an explicit color and icon beat the frontmatter" do
        document = create(with_frontmatter("fundamento/color: indigo\nfundamento/icon: \"🔥\""), color: "teal", icon: "🌱")

        expect(document.reload.color).to eq("teal")
        expect(document.icon).to eq(Icon.emoji("🌱"))
      end
    end

    describe "#create_from_file!" do
      it "applies the keys from the converted markdown" do
        allow(PandocConverterService).to receive(:convert_upload)
          .and_return({markdown: with_frontmatter("fundamento/color: Blue\nfundamento/icon: \"🔥\""), title: "Converted"})

        document = service.create_from_file!(space_id: space.id, file: double("file"))

        expect(document.reload.color).to eq("blue")
        expect(document.icon).to eq(Icon.emoji("🔥"))
      end

      it "lets an explicit color beat the frontmatter" do
        allow(PandocConverterService).to receive(:convert_upload)
          .and_return({markdown: with_frontmatter("fundamento/color: blue"), title: "Converted"})

        document = service.create_from_file!(space_id: space.id, file: double("file"), color: "slate")

        expect(document.reload.color).to eq("slate")
      end
    end

    describe "#update!" do
      let(:document) do
        documents(:one).tap do |doc|
          doc.assign_color("crimson")
          doc.assign_title_and_icon(icon: "🌱")
          doc.save!
        end
      end

      it "a markdown update without the keys leaves the existing color and icon unchanged" do
        service.update!(document_id: document.id, markdown: with_frontmatter("title: Hello"))

        expect(document.reload.color).to eq("crimson")
        expect(document.icon).to eq(Icon.emoji("🌱"))
      end

      it "a markdown update with an invalid value leaves them unchanged" do
        service.update!(document_id: document.id, markdown: with_frontmatter("fundamento/color: \"\"\nfundamento/icon: fire"))

        expect(document.reload.color).to eq("crimson")
        expect(document.icon).to eq(Icon.emoji("🌱"))
      end

      it "a markdown update with a valid key changes them" do
        service.update!(document_id: document.id, markdown: with_frontmatter("fundamento/color: lime\nfundamento/icon: \"🔥\""))

        expect(document.reload.color).to eq("lime")
        expect(document.icon).to eq(Icon.emoji("🔥"))
      end

      it "an explicit color argument beats the frontmatter value" do
        service.update!(document_id: document.id, color: "slate", markdown: with_frontmatter("fundamento/color: lime"))

        expect(document.reload.color).to eq("slate")
      end

      it "an explicit empty color clears it even when the frontmatter carries one" do
        service.update!(document_id: document.id, color: "", markdown: with_frontmatter("fundamento/color: lime"))

        expect(document.reload.color).to be_nil
      end
    end
  end

  describe "round trip of an exported frontmatter block" do
    let(:exporter) { Class.new { include MarkdownFrontmatter }.new }
    let(:title) { "Plan: Q4 \"launch\" #1 {{x}}" }
    let(:source) do
      documents(:one).tap do |doc|
        doc.assign_title_and_icon(title: title, icon: "🔥")
        doc.assign_color("indigo")
        doc.save!
        TagsService.new(object: doc, organization: organization).update_tags(["blog", "ikigai/blog"])
      end.reload
    end
    let(:exported) { exporter.build_frontmatter(source) + "Body" }

    def tag_names(document)
      document.tags.reload.map(&:name)
    end

    it "update! reproduces icon, color and tags" do
      target = documents(:two)

      service.update!(document_id: target.id, markdown: exported)

      target.reload
      expect(target.icon).to eq(Icon.emoji("🔥"))
      expect(target.color).to eq("indigo")
      expect(tag_names(target)).to match_array(["blog", "ikigai/blog"])
    end

    it "create! reproduces icon, color and tags" do
      created = service.create!(space_id: space.id, title: "Whatever", markdown: exported).reload

      expect(created.icon).to eq(Icon.emoji("🔥"))
      expect(created.color).to eq("indigo")
      expect(tag_names(created)).to match_array(["blog", "ikigai/blog"])
    end

    it "the exported title is the stored title and survives extract_frontmatter" do
      _body, data = exporter.extract_frontmatter(exported)

      expect(data["title"]).to eq(source.title)
      expect(data["title"]).to eq(title)
    end
  end
end
