class InlineCommentThread < ApplicationRecord
  belongs_to :document
  has_many :inline_comments
end
