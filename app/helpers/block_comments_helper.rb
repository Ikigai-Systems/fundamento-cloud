module BlockCommentsHelper
  # What the editor and the read-only document view need to show a block's comments under it.
  # The keys are camelCase because the Stimulus editor takes them as they are.
  #
  # A version shows the comments on the blocks it has, whether or not the document still has them,
  # and takes no new ones: a comment belongs to the document as it is now.
  def block_comments_props(document, version: nil)
    block_ids = document.commented_block_ids
    block_ids &= BlocknoteBlocks.block_ids(version.content_blocks) if version

    {
      objectGid: document.to_gid_param,
      blockIds: block_ids,
      canComment: version.nil? && policy(document.comments.new).create?
    }
  end
end
