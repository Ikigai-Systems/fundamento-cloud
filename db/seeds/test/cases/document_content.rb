# Opt-in: gives the shared documents Yjs content. `seed "test/cases/document_content"` in a spec.
yjs = File.binread(Rails.root.join("app/templates/space.yjs"))
[documents.one, documents.two].each { |document| document.content_or_build.update!(sync: yjs) }
