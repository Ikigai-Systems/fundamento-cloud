require 'rails_helper'

RSpec.describe BlockNoteConverter do
  xit "converts colored texts" do
    binary_sync = File.read("spec/fixtures/block_note_blocks/colored_texts.sync")
    expected_blocks = JSON.parse(File.read("spec/fixtures/block_note_blocks/colored_texts.json"))

    converted = described_class.to_blocks(binary_sync)

    expect(converted).to(be_eql(expected_blocks))
  end
end