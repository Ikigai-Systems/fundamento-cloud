# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2024_09_12_141556) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "attachments", force: :cascade do |t|
    t.string "filename"
    t.string "mime_type"
    t.binary "data"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "organization_id"
    t.string "parent_type", null: false
    t.bigint "parent_id", null: false
    t.index ["organization_id"], name: "index_attachments_on_organization_id"
    t.index ["parent_type", "parent_id"], name: "index_attachments_on_parent"
  end

  create_table "documents", force: :cascade do |t|
    t.json "content"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.binary "sync"
    t.string "title"
    t.bigint "organization_id"
    t.bigint "space_id"
    t.boolean "archived", default: false
    t.index ["organization_id"], name: "index_documents_on_organization_id"
    t.index ["space_id"], name: "index_documents_on_space_id"
  end

  create_table "invited_users", force: :cascade do |t|
    t.bigint "organization_id"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "invitation_token"
    t.datetime "invitation_created_at"
    t.datetime "invitation_sent_at"
    t.datetime "invitation_accepted_at"
    t.integer "invitation_limit"
    t.string "invited_by_type"
    t.bigint "invited_by_id"
    t.integer "invitations_count", default: 0
    t.text "first_name", default: "", null: false
    t.text "last_name", default: "", null: false
    t.index ["email", "organization_id"], name: "index_invited_users_on_email_and_organization_id", unique: true
    t.index ["invitation_token"], name: "index_invited_users_on_invitation_token", unique: true
    t.index ["invited_by_id"], name: "index_invited_users_on_invited_by_id"
    t.index ["invited_by_type", "invited_by_id"], name: "index_invited_users_on_invited_by"
    t.index ["organization_id"], name: "index_invited_users_on_organization_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "npi", default: -> { "gen_random_uuid()" }, null: false
    t.index ["npi"], name: "index_organizations_on_npi", unique: true
  end

  create_table "organizations_users", id: false, force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "user_id", null: false
    t.integer "role", limit: 2, default: 0, null: false
    t.index ["organization_id", "user_id"], name: "index_organizations_users_on_organization_id_and_user_id", unique: true
    t.index ["user_id", "organization_id"], name: "index_organizations_users_on_user_id_and_organization_id", unique: true
  end

  create_table "public_links", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.string "object_type", null: false
    t.bigint "object_id", null: false
    t.string "npi", null: false
    t.bigint "updated_by_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["npi"], name: "index_public_links_on_npi", unique: true
    t.index ["object_id", "object_type", "organization_id"], name: "idx_on_object_id_object_type_organization_id_771a32f229", unique: true
    t.index ["object_type", "object_id"], name: "index_public_links_on_object"
    t.index ["organization_id"], name: "index_public_links_on_organization_id"
    t.index ["updated_by_id"], name: "index_public_links_on_updated_by_id"
  end

  create_table "space_memberships", force: :cascade do |t|
    t.bigint "space_id"
    t.string "member_type"
    t.bigint "member_id"
    t.integer "role", limit: 2, default: 0, null: false
    t.bigint "organization_id", null: false
    t.index ["member_id", "member_type", "space_id"], name: "idx_on_member_id_member_type_space_id_e2ffbf3808", unique: true
    t.index ["member_type", "member_id"], name: "index_space_managers_on_manager"
    t.index ["organization_id"], name: "index_space_memberships_on_organization_id"
    t.index ["space_id"], name: "index_space_memberships_on_space_id"
  end

  create_table "spaces", force: :cascade do |t|
    t.json "hierarchy"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "organization_id"
    t.string "name"
    t.bigint "home_document_id"
    t.integer "access_mode", limit: 2, default: 0, null: false
    t.string "npi", default: -> { "gen_random_uuid()" }, null: false
    t.index ["name", "organization_id"], name: "index_spaces_on_name_and_organization_id", unique: true
    t.index ["npi"], name: "index_spaces_on_npi", unique: true
    t.index ["organization_id"], name: "index_spaces_on_organization_id"
  end

  create_table "table_cells", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "table_id", null: false
    t.bigint "column_id", null: false
    t.bigint "row_id", null: false
    t.string "value"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["column_id"], name: "index_table_cells_on_column_id"
    t.index ["organization_id"], name: "index_table_cells_on_organization_id"
    t.index ["row_id"], name: "index_table_cells_on_row_id"
    t.index ["table_id"], name: "index_table_cells_on_table_id"
  end

  create_table "table_columns", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "table_id", null: false
    t.string "name", null: false
    t.integer "kind", limit: 2, null: false
    t.bigint "previous_column_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "value_formula"
    t.index ["name", "table_id"], name: "index_table_columns_on_name_and_table_id", unique: true
    t.index ["organization_id"], name: "index_table_columns_on_organization_id"
    t.index ["previous_column_id"], name: "index_table_columns_on_previous_column_id"
    t.index ["table_id"], name: "index_table_columns_on_table_id"
  end

  create_table "table_rows", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "table_id", null: false
    t.bigint "previous_row_id"
    t.index ["organization_id"], name: "index_table_rows_on_organization_id"
    t.index ["previous_row_id"], name: "index_table_rows_on_previous_row_id"
    t.index ["table_id"], name: "index_table_rows_on_table_id"
  end

  create_table "tables", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "space_id", null: false
    t.string "parent_type", null: false
    t.bigint "parent_id", null: false
    t.string "name", null: false
    t.boolean "archived", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name", "space_id", "organization_id"], name: "index_tables_on_name_and_space_id_and_organization_id", unique: true
    t.index ["organization_id"], name: "index_tables_on_organization_id"
    t.index ["parent_type", "parent_id"], name: "index_tables_on_parent"
    t.index ["space_id"], name: "index_tables_on_space_id"
  end

  create_table "team_memberships", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "team_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "member_type", null: false
    t.bigint "member_id", null: false
    t.index ["member_id", "member_type", "team_id"], name: "idx_on_member_id_member_type_team_id_fa57caa5d8", unique: true
    t.index ["member_type", "member_id"], name: "index_team_memberships_on_member"
    t.index ["organization_id"], name: "index_team_memberships_on_organization_id"
    t.index ["team_id"], name: "index_team_memberships_on_team_id"
  end

  create_table "teams", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.string "name", null: false
    t.string "shortcut", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "npi", default: -> { "gen_random_uuid()" }, null: false
    t.index ["name", "organization_id"], name: "index_teams_on_name_and_organization_id", unique: true
    t.index ["npi"], name: "index_teams_on_npi", unique: true
    t.index ["organization_id"], name: "index_teams_on_organization_id"
    t.index ["shortcut", "organization_id"], name: "index_teams_on_shortcut_and_organization_id", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.integer "organization_role", limit: 2, default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "first_name"
    t.text "last_name"
    t.string "invitation_token"
    t.datetime "invitation_created_at"
    t.datetime "invitation_sent_at"
    t.datetime "invitation_accepted_at"
    t.integer "invitation_limit"
    t.string "invited_by_type"
    t.bigint "invited_by_id"
    t.integer "invitations_count", default: 0
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["invitation_token"], name: "index_users_on_invitation_token", unique: true
    t.index ["invited_by_id"], name: "index_users_on_invited_by_id"
    t.index ["invited_by_type", "invited_by_id"], name: "index_organization_users_on_invited_by"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "versions", force: :cascade do |t|
    t.json "content"
    t.bigint "document_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "sequential_id", null: false
    t.index ["document_id"], name: "index_versions_on_document_id"
    t.index ["sequential_id", "document_id"], name: "index_versions_on_sequential_id_and_document_id", unique: true
  end

  add_foreign_key "attachments", "organizations"
  add_foreign_key "documents", "organizations"
  add_foreign_key "documents", "spaces"
  add_foreign_key "invited_users", "organizations"
  add_foreign_key "spaces", "documents", column: "home_document_id"
  add_foreign_key "spaces", "organizations"
  add_foreign_key "table_cells", "table_columns", column: "column_id"
  add_foreign_key "table_cells", "table_rows", column: "row_id"
  add_foreign_key "table_columns", "table_columns", column: "previous_column_id"
  add_foreign_key "table_rows", "table_rows", column: "previous_row_id"
  add_foreign_key "team_memberships", "organizations"
  add_foreign_key "team_memberships", "teams"
  add_foreign_key "teams", "organizations"
  add_foreign_key "versions", "documents"
end
