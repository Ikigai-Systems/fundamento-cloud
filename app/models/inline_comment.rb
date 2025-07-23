class InlineComment < ApplicationRecord
  belongs_to :inline_comment_thread
  belongs_to :user
end
