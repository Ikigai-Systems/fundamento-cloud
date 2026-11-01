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

      it "keeps tags, color and icon when the markdown is only frontmatter" do
        document = create("---\ntags: [alpha, beta]\nfundamento/color: indigo\nfundamento/icon: \"🔥\"\n---\n")

        document.reload
        expect(document.tags.map(&:name)).to match_array(%w[alpha beta])
        expect(document.color).to eq("indigo")
        expect(document.icon).to eq(Icon.emoji("🔥"))
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

      it "rejects a bad explicit color or icon before converting the file" do
        expect(PandocConverterService).not_to receive(:convert_upload)

        expect {
          service.create_from_file!(space_id: space.id, file: double("file"), color: "chartreuse")
        }.to raise_error(ArgumentError, /Color must be one of/)

        expect {
          service.create_from_file!(space_id: space.id, file: double("file"), icon: "fire")
        }.to raise_error(ArgumentError, /Icon must be a single emoji/)
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
        service.update!(document_id: document.id, markdown: with_frontmatter("tags: [a]"))

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

  describe "frontmatter title" do
    let(:document) { documents(:one) }

    it "#create! names the document after it when no title is given" do
      created = service.create!(space_id: space.id, title: nil, markdown: with_frontmatter("title: From the file"))

      expect(created.reload.title).to eq("From the file")
    end

    it "#create! lets an explicit title win" do
      created = service.create!(space_id: space.id, title: "Explicit", markdown: with_frontmatter("title: From the file"))

      expect(created.reload.title).to eq("Explicit")
    end

    it "#create! falls back to Untitled for a blank or non-text title" do
      ["title: ''", "title: [a, b]", "title:"].each do |line|
        created = service.create!(space_id: space.id, title: nil, markdown: with_frontmatter(line))

        expect(created.reload.read_attribute(:title)).to eq("Untitled")
      end
    end

    it "#create! reads a bare number as the title's text" do
      created = service.create!(space_id: space.id, title: nil, markdown: with_frontmatter("title: 2024"))

      expect(created.reload.title).to eq("2024")
    end

    it "#update! renames the document, so an edited export writes its title back" do
      service.update!(document_id: document.id, markdown: with_frontmatter("title: Renamed in the file"))

      expect(document.reload.title).to eq("Renamed in the file")
    end

    it "#update! lets an explicit title win" do
      service.update!(document_id: document.id, title: "Explicit", markdown: with_frontmatter("title: From the file"))

      expect(document.reload.title).to eq("Explicit")
    end

    it "#update! keeps the title when the frontmatter has none, or a blank one" do
      original = document.title

      service.update!(document_id: document.id, markdown: with_frontmatter("tags: [a]"))
      service.update!(document_id: document.id, markdown: with_frontmatter("title: ''"))

      expect(document.reload.title).to eq(original)
    end

    it "#create_from_file! prefers it to the file name the converter took a title from" do
      allow(PandocConverterService).to receive(:convert_upload)
        .and_return({markdown: with_frontmatter("title: From the file"), title: "report"})

      created = service.create_from_file!(space_id: space.id, file: "x.docx")

      expect(created.reload.title).to eq("From the file")
    end

    it "#create_from_file! keeps the file name when the frontmatter has no title" do
      allow(PandocConverterService).to receive(:convert_upload)
        .and_return({markdown: with_frontmatter("tags: [a]"), title: "report"})

      created = service.create_from_file!(space_id: space.id, file: "x.docx")

      expect(created.reload.title).to eq("report")
    end

    it "#create! treats a blank title as none given" do
      created = service.create!(space_id: space.id, title: "  ", markdown: with_frontmatter("title: From the file"))

      expect(created.reload.title).to eq("From the file")
    end
  end

  describe "round trip of an exported frontmatter block" do
    let(:title) { "Plan: Q4 \"launch\" #1 {{x}}" }
    let(:source) do
      documents(:one).tap do |doc|
        doc.assign_title_and_icon(title: title, icon: "🔥")
        doc.assign_color("indigo")
        doc.save!
        TagsService.new(object: doc, organization: organization).update_tags(["blog", "ikigai/blog"])
      end.reload
    end
    let(:exported) { source.to_frontmatter + "Body" }

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
  end
end
