require "rails_helper"

# The exact pipeline MigrateAttachmentToNpiPk uses on object_contents.sync: decode the Yjs
# state, rewrite the embedded attachment ids, re-encode, and decode again to check the result
# reads back. Attachment ids live in 82% of stored versions and in 1,303 live Yjs documents, so
# this is the step that decides whether changing their primary key loses user content.
RSpec.describe "rewriting attachment ids embedded in document content" do
  let(:mapping) { {"123" => "nEwNaNoId1", "456" => "oThErNaNo2"} }

  let(:blocks) do
    [
      {"id" => "p1", "type" => "paragraph",
       "props" => {"backgroundColor" => "default", "textColor" => "default", "textAlignment" => "left"},
       "children" => [],
       "content" => [
         {"type" => "text", "text" => "see ", "styles" => {}},
         {"type" => "link", "href" => "attachment:123",
          "content" => [{"type" => "text", "text" => "the photo", "styles" => {"bold" => true}}]},
         {"type" => "text", "text" => " and ", "styles" => {}},
         {"type" => "link", "href" => "https://example.com/docs",
          "content" => [{"type" => "text", "text" => "example site", "styles" => {}}]},
       ]},
      {"id" => "i1", "type" => "image",
       "props" => {"backgroundColor" => "default", "textAlignment" => "left",
                   "url" => "attachment:456.png", "caption" => "", "showPreview" => true,
                   "previewWidth" => 512, "name" => "photo.png"},
       "children" => [], "content" => []},
    ]
  end

  def normalise(node)
    case node
    when Array then node.map { normalise(_1) }
    when Hash
      node.reject { |k, v| k == "children" && (v.nil? || v == []) }
          .transform_values { normalise(_1) }.sort.to_h
    else node
    end
  end

  it "carries the rewritten ids through a Yjs encode and decode" do
    sync = BlocknoteConverterService.blocks_to_yjs(blocks)
    expect(sync).to include("attachment:123")

    decoded = BlocknoteConverterService.yjs_to_blocks(sync)
    changed = BlocknoteBlocks.rewrite_attachment_ids!(decoded, mapping)

    # The link href and the image's props.url.
    expect(changed).to eq(2)

    encoded = BlocknoteConverterService.blocks_to_yjs(decoded)
    readback = BlocknoteConverterService.yjs_to_blocks(encoded)

    expect(normalise(readback)).to eq(normalise(decoded)),
      "the re-encoded Yjs state did not read back as what we meant to write"

    json = readback.to_json
    expect(json).to include("attachment:nEwNaNoId1", "attachment:oThErNaNo2.png")
    expect(json).not_to include("attachment:123", "attachment:456")

    # Nothing else moved.
    expect(json).to include("https://example.com/docs", "the photo", "photo.png")
  end

  it "leaves a document with no attachment reference untouched" do
    plain = [{"id" => "p1", "type" => "paragraph",
              "props" => {"backgroundColor" => "default", "textColor" => "default", "textAlignment" => "left"},
              "children" => [], "content" => [{"type" => "text", "text" => "nothing here", "styles" => {}}]}]

    decoded = BlocknoteConverterService.yjs_to_blocks(BlocknoteConverterService.blocks_to_yjs(plain))

    expect(BlocknoteBlocks.rewrite_attachment_ids!(decoded, mapping)).to eq(0)
  end
end
