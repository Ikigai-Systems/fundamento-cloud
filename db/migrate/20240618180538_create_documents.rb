class CreateDocuments < ActiveRecord::Migration[7.1]
  def change
    create_table :documents do |t|
      # todo: convert to jsonb if we go with postgresql
      t.json :content

      t.timestamps
    end
  end
end
