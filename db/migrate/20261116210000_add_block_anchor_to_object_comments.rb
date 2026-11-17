# A comment can be about one block of a document. The block id is the anchor; the quote and the
# text around it only remember what was being commented on (to highlight it, and to find the
# block again if its id is lost), and the snapshot is the block's text when the comment was made,
# so a comment whose block is gone can still say what it was about. A comment with no anchor is a
# comment on the document, as before.
class AddBlockAnchorToObjectComments < ActiveRecord::Migration[8.1]
  def change
    add_column :object_comments, :anchor_block_id, :string
    add_column :object_comments, :anchor_quote, :text
    add_column :object_comments, :anchor_prefix, :text
    add_column :object_comments, :anchor_suffix, :text
    add_column :object_comments, :anchor_text, :text

    add_index :object_comments, [:object_type, :object_id, :anchor_block_id],
      name: "index_object_comments_on_object_and_anchor_block_id"
  end
end
