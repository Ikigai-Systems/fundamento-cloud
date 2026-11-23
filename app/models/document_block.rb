# A block a document has had, and the latest saved version that still had it. A block that
# is not in the latest version has been removed from the document.
class DocumentBlock < ApplicationRecord
  skip_auditing

  belongs_to :document
  belongs_to :last_version, class_name: "Version"
end
