require "rails_helper"

RSpec.describe BlocknoteConverterService do
  describe ".blocks_to_markdown" do
    # The converter's output is read in binary mode, which Yjs payloads need. Markdown is
    # text: tagged binary, it can't be serialised to JSON once it holds non-ASCII characters.
    it "returns UTF-8 text that serialises to JSON" do
      blocks = described_class.markdown_to_blocks("Zażółć gęślą jaźń — “quoted”")

      markdown = described_class.blocks_to_markdown(blocks)

      expect(markdown.encoding).to eq(Encoding::UTF_8)
      expect(markdown).to be_valid_encoding
      expect(JSON.parse(JSON.generate(text: markdown))["text"]).to include("Zażółć gęślą jaźń")
    end
  end

  describe ".markdown_to_blocks_and_yjs" do
    let(:markdown) { "# Heading\n\nA paragraph with a [link](https://example.com).\n\n- one\n- two\n" }

    it "returns the blocks and a Yjs state that holds the same document" do
      blocks, sync = described_class.markdown_to_blocks_and_yjs(markdown)

      expect(blocks.map { |block| block["type"] }).to eq(%w[heading paragraph bulletListItem bulletListItem])
      expect(sync.encoding).to eq(Encoding::BINARY)
      expect(described_class.yjs_to_blocks(sync)).to eq(blocks)
    end

    it "handles empty markdown" do
      blocks, sync = described_class.markdown_to_blocks_and_yjs("")

      expect(described_class.yjs_to_blocks(sync)).to eq(blocks)
    end
  end

  # There was no timeout here, and one document that never came back hung a production
  # migration for over an hour mid-transaction. The converter is replaced with a script that
  # deliberately never exits, so the test is of the timeout rather than of a slow document.
  describe "a conversion that never returns" do
    let(:never_exits) { Rails.root.join("tmp/never_exits.cjs") }

    before do
      FileUtils.mkdir_p(never_exits.dirname)
      never_exits.write("process.stdin.resume(); setInterval(() => {}, 1000);\n")
      stub_const("BlocknoteConverterService::SCRIPT", never_exits.to_s)
    end

    after { FileUtils.rm_f(never_exits) }

    it "gives up rather than waiting forever" do
      expect { described_class.yjs_to_blocks("anything", timeout: 2) }
        .to raise_error(BlocknoteConverterService::ConversionTimeout, /did not finish within 2s/)
    end

    # A timeout that leaves the process running would leak one per document.
    it "kills the subprocess it gave up on" do
      before_count = `pgrep -f never_exits.cjs`.split.size

      expect { described_class.yjs_to_blocks("anything", timeout: 2) }
        .to raise_error(BlocknoteConverterService::ConversionTimeout)

      sleep 0.5
      expect(`pgrep -f never_exits.cjs`.split.size).to eq(before_count)
    end

    # Callers that already rescue ConversionError keep working.
    it "is a ConversionError" do
      expect(BlocknoteConverterService::ConversionTimeout.ancestors)
        .to include(BlocknoteConverterService::ConversionError)
    end
  end
end
