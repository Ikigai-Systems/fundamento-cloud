namespace :fix do
  desc "Make sure all documents belong to a space"
  task documents_belongs_to_space: :environment do
    ActiveRecord::Base.logger = Logger.new(STDOUT)

    first_space_for_organization_id = Hash.new { |hash, organization_id| Organization.find_by_id!(organization_id).spaces.first! }

    Document.where(space: nil).each do |document|
      document.update!(space: first_space_for_organization_id[document.organization_id])
    end
  end
end