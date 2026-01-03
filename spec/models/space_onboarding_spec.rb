require "rails_helper"

RSpec.describe "Space onboarding content", type: :model do
  describe "onboarding content creation" do
    context "single organization" do
      let(:organization) { Organization.create!(name: "Test Org") }
      let(:space) { organization.spaces.first }

      # Organization.create! automatically creates a default space and populates it
      # No need to call populate_with_onboarding_content! manually

      it "creates exactly 3 tables from CSV files" do
        expect(space.tables.count).to eq(3)
      end

      it "creates onboarding documents" do
        # Should create multiple onboarding documents (one per .yjs file)
        expect(space.documents.count).to be > 3
      end

      it "has no duplicate table NPIs within the space" do
        table_ids = space.tables.pluck(:id)

        expect(table_ids.uniq.count).to eq(table_ids.count),
          "Found duplicate table NPIs within one space: #{table_ids.select { |id| table_ids.count(id) > 1 }.uniq}"
      end

      it "has no duplicate column NPIs within each table" do
        space.tables.each do |table|
          column_npis = table.columns.pluck(:npi)

          expect(column_npis.uniq.count).to eq(column_npis.count),
            "Found duplicate column NPIs in table #{table.id}: #{column_npis.select { |npi| column_npis.count(npi) > 1 }.uniq}"
        end
      end

      it "creates table with specific name for advanced table" do
        advanced_table = space.tables.find_by(name: "Advanced Table: Customer their first full month of sales")

        expect(advanced_table).to be_present
        expect(advanced_table.name).to eq("Advanced Table: Customer their first full month of sales")
        expect(advanced_table.id).to be_present
        expect(advanced_table.id).not_to eq("7hDhcL1cyv") # Should NOT be hardcoded NPI
      end

      it "generates unique column NPIs for advanced table columns" do
        advanced_table = space.tables.find_by(name: "Advanced Table: Customer their first full month of sales")
        column_npis = advanced_table.columns_in_order.map(&:npi)

        # Verify columns exist with dynamically generated NPIs
        expect(column_npis.length).to eq(7)
        expect(column_npis.uniq.length).to eq(7) # All NPIs should be unique

        # Verify none use the old hardcoded NPIs
        expect(column_npis).not_to include("sample_column_name")
        expect(column_npis).not_to include("sample_column_2")
        expect(column_npis).not_to include("eXqGtIyEmPqW2pC0uwk39")
      end
    end

    context "multiple organizations (NPI uniqueness - NOW FIXED)" do
      # Create two separate organizations
      # Each automatically gets a default space with onboarding content
      let(:organization1) { Organization.create!(name: "Test Org 1") }
      let(:organization2) { Organization.create!(name: "Test Org 2") }
      let(:space1) { organization1.spaces.first }
      let(:space2) { organization2.spaces.first }

      it "creates unique table NPIs across organizations (BUG FIXED)" do
        space1_ids = space1.tables.pluck(:id)
        space2_ids = space2.tables.pluck(:id)

        duplicates = space1_ids & space2_ids

        # After refactoring, NPIs should be globally unique
        expect(duplicates).to be_empty,
          "Expected unique table NPIs across organizations but found duplicates: #{duplicates.join(', ')}"
      end

      it "creates unique column NPIs in advanced tables across organizations (BUG FIXED)" do
        table1 = space1.tables.find_by(name: "Advanced Table: Customer their first full month of sales")
        table2 = space2.tables.find_by(name: "Advanced Table: Customer their first full month of sales")

        expect(table1).to be_present, "Advanced table not found in space1"
        expect(table2).to be_present, "Advanced table not found in space2"

        column_npis_1 = table1.columns.pluck(:npi)
        column_npis_2 = table2.columns.pluck(:npi)

        duplicates = column_npis_1 & column_npis_2

        # After refactoring, column NPIs should also be globally unique
        expect(duplicates).to be_empty,
          "Expected unique column NPIs across organizations but found duplicates: #{duplicates.join(', ')}"
      end

      it "allows creating multiple spaces with onboarding in same org (BUG FIXED)" do
        # organization1 already has a default space with onboarding content
        # Try to create a second space and populate it
        second_space = organization1.spaces.create!(name: "Second Space")

        # This should now work because NPIs are globally unique
        expect {
          second_space.populate_with_onboarding_content!
        }.not_to raise_error

        # Verify both spaces have unique table NPIs
        space1_ids = space1.tables.pluck(:id)
        space2_ids = second_space.tables.pluck(:id)
        duplicates = space1_ids & space2_ids

        expect(duplicates).to be_empty,
          "Expected unique table NPIs between spaces in same org but found duplicates: #{duplicates.join(', ')}"
      end
    end

    context "BlockNote document references" do
      let(:organization) { Organization.create!(name: "Test Org Refs") }
      let(:space) { organization.spaces.first }

      it "has advancedTable blocks referencing the created table NPIs" do
        # Find document with formula content (contains advancedTable block)
        formula_doc = space.documents.joins(:versions)
          .where("versions.content_blocks::text LIKE ?", "%advancedTable%")
          .first

        expect(formula_doc).to be_present

        # Parse the content_blocks JSON
        content_blocks = formula_doc.versions.last.content_blocks

        # Find advancedTable blocks
        advanced_table_blocks = content_blocks.select { |block| block["type"] == "advancedTable" }

        expect(advanced_table_blocks).not_to be_empty

        # Check that tableNpi references match actual created tables
        advanced_table_blocks.each do |block|
          table_npi = block["props"]["tableNpi"]

          expect(table_npi).to be_present
          expect(space.tables.where(id: table_npi)).to exist,
            "BlockNote document references table NPI '#{table_npi}' but no such table exists in space"
        end
      end

      it "advanced table block references dynamically generated NPI (NOT hardcoded)" do
        # Find the advanced table by name
        advanced_table = space.tables.find_by(name: "Advanced Table: Customer their first full month of sales")
        expect(advanced_table).to be_present

        # Find the "Formulas" document which contains the advancedTable block for this table
        formula_doc = space.documents.find_by(title: "Formulas")
        expect(formula_doc).to be_present

        content_blocks = formula_doc.versions.last.content_blocks
        advanced_table_block = content_blocks.find { |block|
          block["type"] == "advancedTable" &&
          block["props"]["tableNpi"] == advanced_table.id
        }

        expect(advanced_table_block).to be_present
        expect(advanced_table_block["props"]["tableNpi"]).to eq(advanced_table.id)
        expect(advanced_table_block["props"]["tableNpi"]).not_to eq("7hDhcL1cyv") # Should NOT be hardcoded
      end

      it "all referenced table NPIs in documents match actual tables" do
        # Get all documents with advancedTable blocks
        docs_with_tables = space.documents.joins(:versions)
          .where("versions.content_blocks::text LIKE ?", "%advancedTable%")

        docs_with_tables.each do |doc|
          content_blocks = doc.versions.last.content_blocks

          advanced_table_blocks = content_blocks.select { |block|
            block["type"] == "advancedTable" && block["props"]["tableNpi"].present?
          }

          advanced_table_blocks.each do |block|
            table_npi = block["props"]["tableNpi"]

            expect(space.tables.where(id: table_npi)).to exist,
              "Document '#{doc.title}' references table NPI '#{table_npi}' but no such table exists"
          end
        end
      end
    end

    context "table structure and content" do
      let(:organization) { Organization.create!(name: "Test Org Tables") }
      let(:space) { organization.spaces.first }

      it "creates tables with correct column counts from CSV" do
        advanced_table = space.tables.find_by(name: "Advanced Table: Customer their first full month of sales")

        # CSV has 7 columns: Customer, Month, Sales, CustomerSuccess, Acquisition source, Sales figures, Notes
        expect(advanced_table.columns.count).to eq(7)
        expect(advanced_table.rows.count).to be > 0
      end

      it "creates tables with data from CSV files" do
        advanced_table = space.tables.find_by(name: "Advanced Table: Customer their first full month of sales")

        expect(advanced_table.rows.count).to be > 0
        expect(advanced_table.cells.count).to be > 0
      end
    end
  end
end
