module BlockCommentsHelper
  # What the editor and the read-only document view need to show a block's comments under it.
  # The keys are camelCase because the Stimulus editor takes them as they are.
  def block_comments_props(document)
    {
      objectGid: document.to_gid_param,
      blockIds: document.commented_block_ids,
      canComment: policy(document.comments.new).create?
    }
  end
end
