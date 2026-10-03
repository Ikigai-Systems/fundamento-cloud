require "rails_helper"

RSpec.describe BlocknoteConverterService do
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
end
