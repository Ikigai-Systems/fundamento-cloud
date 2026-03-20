require "rails_helper"

RSpec.describe BlocknoteBlocks do
  describe ".walk_blocks" do
    it "yields each hash node in a flat list" do
      blocks = [
        { "type" => "paragraph", "id" => "1" },
        { "type" => "heading", "id" => "2" }
      ]

      yielded = []
      described_class.walk_blocks(blocks) { |node| yielded << node["id"] }

      expect(yielded).to eq(["1", "2"])
    end

    it "traverses inline content arrays" do
      blocks = [
        {
          "type" => "paragraph",
          "id" => "1",
          "content" => [
            { "type" => "text", "text" => "hello" },
            { "type" => "mention", "props" => { "id" => "m1" } }
          ]
        }
      ]

      yielded_types = []
      described_class.walk_blocks(blocks) { |node| yielded_types << node["type"] }

      expect(yielded_types).to eq(["paragraph", "text", "mention"])
    end

    it "traverses nested children arrays" do
      blocks = [
        {
          "type" => "paragraph",
          "id" => "1",
          "children" => [
            {
              "type" => "paragraph",
              "id" => "2",
              "children" => [
                { "type" => "paragraph", "id" => "3" }
              ]
            }
          ]
        }
      ]

      yielded_ids = []
      described_class.walk_blocks(blocks) { |node| yielded_ids << node["id"] }

      expect(yielded_ids).to eq(["1", "2", "3"])
    end

    it "skips non-hash elements in the array" do
      blocks = [nil, "string", 42, { "type" => "paragraph", "id" => "1" }]

      yielded = []
      described_class.walk_blocks(blocks) { |node| yielded << node }

      expect(yielded.size).to eq(1)
      expect(yielded.first["id"]).to eq("1")
    end

    it "returns nil for non-array input" do
      result = described_class.walk_blocks(nil) { |_| }
      expect(result).to be_nil
    end

    it "handles empty array" do
      yielded = []
      described_class.walk_blocks([]) { |node| yielded << node }

      expect(yielded).to be_empty
    end
  end

  describe ".each_mention" do
    it "yields only mention nodes" do
      blocks = [
        {
          "type" => "paragraph",
          "id" => "1",
          "content" => [
            { "type" => "text", "text" => "hello" },
            { "type" => "mention", "props" => { "id" => "m1", "entity" => "user" } },
            { "type" => "text", "text" => " world" },
            { "type" => "mention", "props" => { "id" => "m2", "entity" => "document" } }
          ]
        }
      ]

      mentions = []
      described_class.each_mention(blocks) { |node| mentions << node }

      expect(mentions.size).to eq(2)
      expect(mentions.map { |m| m.dig("props", "id") }).to eq(["m1", "m2"])
    end

    it "finds mentions in nested children" do
      blocks = [
        {
          "type" => "paragraph",
          "children" => [
            {
              "type" => "paragraph",
              "content" => [
                { "type" => "mention", "props" => { "id" => "deep" } }
              ]
            }
          ]
        }
      ]

      mentions = []
      described_class.each_mention(blocks) { |node| mentions << node }

      expect(mentions.size).to eq(1)
      expect(mentions.first.dig("props", "id")).to eq("deep")
    end

    it "returns empty for blocks with no mentions" do
      blocks = [
        {
          "type" => "paragraph",
          "content" => [
            { "type" => "text", "text" => "no mentions here" }
          ]
        }
      ]

      mentions = []
      described_class.each_mention(blocks) { |node| mentions << node }

      expect(mentions).to be_empty
    end
  end

  describe ".extract_references" do
    it "extracts mention references with all fields" do
      blocks = [
        {
          "type" => "paragraph",
          "content" => [
            {
              "type" => "mention",
              "props" => {
                "id" => "mention-1",
                "entity" => "document",
                "entityId" => "doc-abc",
                "title" => "My Document"
              }
            }
          ]
        }
      ]

      refs = described_class.extract_references(blocks)

      expect(refs.size).to eq(1)
      expect(refs.first).to eq({
        id: "mention-1",
        entity: "document",
        entity_id: "doc-abc",
        title: "My Document"
      })
    end

    it "extracts advancedTable references using tableNpi" do
      blocks = [
        {
          "id" => "block-1",
          "type" => "advancedTable",
          "props" => {
            "tableNpi" => "tbl-xyz",
            "viewId" => "view1"
          }
        }
      ]

      refs = described_class.extract_references(blocks)

      expect(refs.size).to eq(1)
      expect(refs.first).to eq({
        id: "block-1",
        entity: "table",
        entity_id: "tbl-xyz",
        title: ""
      })
    end

    it "falls back to tableId when tableNpi is absent" do
      blocks = [
        {
          "id" => "block-2",
          "type" => "advancedTable",
          "props" => {
            "tableId" => "tbl-legacy",
            "viewId" => "view1"
          }
        }
      ]

      refs = described_class.extract_references(blocks)

      expect(refs.size).to eq(1)
      expect(refs.first[:entity_id]).to eq("tbl-legacy")
    end

    it "skips mentions with blank id" do
      blocks = [
        {
          "type" => "paragraph",
          "content" => [
            {
              "type" => "mention",
              "props" => {
                "id" => "",
                "entity" => "document",
                "entityId" => "doc-abc"
              }
            }
          ]
        }
      ]

      expect(described_class.extract_references(blocks)).to be_empty
    end

    it "skips mentions with entityId of -1 (integer)" do
      blocks = [
        {
          "type" => "paragraph",
          "content" => [
            {
              "type" => "mention",
              "props" => {
                "id" => "m1",
                "entity" => "document",
                "entityId" => -1
              }
            }
          ]
        }
      ]

      expect(described_class.extract_references(blocks)).to be_empty
    end

    it "skips mentions with entityId of '-1' (string)" do
      blocks = [
        {
          "type" => "paragraph",
          "content" => [
            {
              "type" => "mention",
              "props" => {
                "id" => "m1",
                "entity" => "document",
                "entityId" => "-1"
              }
            }
          ]
        }
      ]

      expect(described_class.extract_references(blocks)).to be_empty
    end

    it "skips advancedTable blocks with blank entity_id" do
      blocks = [
        {
          "id" => "block-1",
          "type" => "advancedTable",
          "props" => {
            "tableNpi" => "",
            "tableId" => ""
          }
        }
      ]

      expect(described_class.extract_references(blocks)).to be_empty
    end

    it "skips advancedTable blocks with blank id" do
      blocks = [
        {
          "id" => "",
          "type" => "advancedTable",
          "props" => {
            "tableNpi" => "tbl-1"
          }
        }
      ]

      expect(described_class.extract_references(blocks)).to be_empty
    end

    it "extracts multiple references from mixed content" do
      blocks = [
        {
          "type" => "paragraph",
          "content" => [
            {
              "type" => "mention",
              "props" => {
                "id" => "m1",
                "entity" => "document",
                "entityId" => "doc-1",
                "title" => "Doc One"
              }
            },
            {
              "type" => "mention",
              "props" => {
                "id" => "m2",
                "entity" => "user",
                "entityId" => "user-1",
                "title" => "Alice"
              }
            }
          ],
          "children" => [
            {
              "id" => "tbl-block",
              "type" => "advancedTable",
              "props" => {
                "tableNpi" => "tbl-1"
              }
            }
          ]
        }
      ]

      refs = described_class.extract_references(blocks)

      expect(refs.size).to eq(3)
      expect(refs.map { |r| r[:id] }).to eq(["m1", "m2", "tbl-block"])
    end

    it "returns empty array for empty blocks" do
      expect(described_class.extract_references([])).to eq([])
    end

    it "returns empty array for nil input" do
      expect(described_class.extract_references(nil)).to eq([])
    end
  end
end
