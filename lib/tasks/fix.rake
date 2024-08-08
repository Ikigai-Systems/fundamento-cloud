namespace :fix do
  desc "Make sure all documents belong to a space"
  task documents_belongs_to_space: :environment do
    ActiveRecord::Base.logger = Logger.new(STDOUT)

    first_space_for_organization_id = Hash.new { |hash, organization_id| Organization.find_by_id!(organization_id).spaces.first! }

    Document.where(space: nil).each do |document|
      document.update!(space: first_space_for_organization_id[document.organization_id])
    end
  end

  desc "Make sure spaces have a home document"
  task home_document_for_spaces: :environment do
    ActiveRecord::Base.logger = Logger.new(STDOUT)

    Space.where(home_document_id: nil).where.not(organization_id: nil).each do |space|
      home_document = space.documents.order(:id).first || space.documents.create!(title: "Home for #{space.name}", organization_id: space.organization_id)

      space.update!(home_document: home_document)
    end
  end
end