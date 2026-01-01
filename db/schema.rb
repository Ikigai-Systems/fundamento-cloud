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

ActiveRecord::Schema[8.1].define(version: 2026_01_01_193001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "api_tokens", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "encrypted_token", null: false
    t.bigint "organization_id"
    t.bigint "organization_user_id"
    t.string "title", default: "", null: false
    t.datetime "updated_at", null: false
    t.datetime "used_at"
    t.index ["encrypted_token"], name: "index_api_tokens_on_encrypted_token", unique: true
    t.index ["organization_id"], name: "index_api_tokens_on_organization_id"
    t.index ["organization_user_id"], name: "index_api_tokens_on_organization_user_id"
  end

  create_table "attachments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.binary "data"
    t.string "filename"
    t.string "mime_type"
    t.bigint "organization_id"
    t.bigint "parent_id", null: false
    t.string "parent_type", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_attachments_on_organization_id"
    t.index ["parent_type", "parent_id"], name: "index_attachments_on_parent"
  end

  create_table "automation_invocations", force: :cascade do |t|
    t.bigint "automation_id"
    t.datetime "created_at", null: false
    t.string "formula"
    t.datetime "invoked_at"
    t.integer "kind", limit: 2, null: false
    t.bigint "organization_id"
    t.string "result"
    t.bigint "run_as_id", null: false
    t.bigint "space_id"
    t.datetime "updated_at", null: false
    t.string "webhook"
    t.index ["automation_id"], name: "index_automation_invocations_on_automation_id"
    t.index ["organization_id"], name: "index_automation_invocations_on_organization_id"
    t.index ["run_as_id"], name: "index_automation_invocations_on_run_as_id"
    t.index ["space_id"], name: "index_automation_invocations_on_space_id"
  end

  create_table "automations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "debug_at"
    t.datetime "disabled_at"
    t.string "formula"
    t.integer "invocations_limit", limit: 2
    t.integer "kind", limit: 2, null: false
    t.string "npi", default: -> { "gen_random_uuid()" }, null: false
    t.bigint "organization_id"
    t.bigint "run_as_id"
    t.bigint "space_id"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_automations_on_organization_id"
    t.index ["run_as_id"], name: "index_automations_on_run_as_id"
    t.index ["space_id"], name: "index_automations_on_space_id"
    t.index ["title", "space_id"], name: "index_automations_on_title_and_space_id", unique: true
  end

  create_table "document_imports", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "document_id"
    t.datetime "imported_at"
    t.text "imported_content"
    t.string "npi", default: -> { "gen_random_uuid()" }, null: false
    t.bigint "organization_id", null: false
    t.bigint "organization_user_id", null: false
    t.bigint "space_id", null: false
    t.datetime "updated_at", null: false
    t.index ["document_id"], name: "index_document_imports_on_document_id"
    t.index ["imported_at"], name: "index_document_imports_on_imported_at"
    t.index ["npi"], name: "index_document_imports_on_npi", unique: true
    t.index ["organization_id"], name: "index_document_imports_on_organization_id"
    t.index ["organization_user_id"], name: "index_document_imports_on_organization_user_id"
    t.index ["space_id"], name: "index_document_imports_on_space_id"
  end

  create_table "documents", force: :cascade do |t|
    t.boolean "archived", default: false
    t.text "content_html", default: ""
    t.datetime "created_at", null: false
    t.string "npi", default: -> { "gen_random_uuid()" }, null: false
    t.json "operations", default: ""
    t.bigint "organization_id"
    t.json "revisions", default: ""
    t.bigint "space_id"
    t.binary "sync"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["npi"], name: "index_documents_on_npi", unique: true
    t.index ["organization_id"], name: "index_documents_on_organization_id"
    t.index ["space_id"], name: "index_documents_on_space_id"
  end

  create_table "favorites", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "npi", null: false
    t.bigint "object_id", null: false
    t.string "object_type", null: false
    t.bigint "organization_user_id", null: false
    t.datetime "updated_at", null: false
    t.index ["object_id", "object_type", "organization_user_id"], name: "idx_on_object_id_object_type_organization_user_id_de4b921bd4", unique: true
    t.index ["object_type", "object_id"], name: "index_favorites_on_object"
    t.index ["organization_user_id"], name: "index_favorites_on_organization_user_id"
  end

  create_table "flipper_features", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_flipper_features_on_key", unique: true
  end

  create_table "flipper_gates", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "feature_key", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.text "value"
    t.index ["feature_key", "key", "value"], name: "index_flipper_gates_on_feature_key_and_key_and_value", unique: true
  end

  create_table "good_job_batches", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "callback_priority"
    t.text "callback_queue_name"
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "discarded_at"
    t.datetime "enqueued_at"
    t.datetime "finished_at"
    t.datetime "jobs_finished_at"
    t.text "on_discard"
    t.text "on_finish"
    t.text "on_success"
    t.jsonb "serialized_properties"
    t.datetime "updated_at", null: false
  end

  create_table "good_job_executions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "active_job_id", null: false
    t.datetime "created_at", null: false
    t.interval "duration"
    t.text "error"
    t.text "error_backtrace", array: true
    t.integer "error_event", limit: 2
    t.datetime "finished_at"
    t.text "job_class"
    t.uuid "process_id"
    t.text "queue_name"
    t.datetime "scheduled_at"
    t.jsonb "serialized_params"
    t.datetime "updated_at", null: false
    t.index ["active_job_id", "created_at"], name: "index_good_job_executions_on_active_job_id_and_created_at"
    t.index ["process_id", "created_at"], name: "index_good_job_executions_on_process_id_and_created_at"
  end

  create_table "good_job_processes", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "lock_type", limit: 2
    t.jsonb "state"
    t.datetime "updated_at", null: false
  end

  create_table "good_job_settings", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "key"
    t.datetime "updated_at", null: false
    t.jsonb "value"
    t.index ["key"], name: "index_good_job_settings_on_key", unique: true
  end

  create_table "good_jobs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "active_job_id"
    t.uuid "batch_callback_id"
    t.uuid "batch_id"
    t.text "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "cron_at"
    t.text "cron_key"
    t.text "error"
    t.integer "error_event", limit: 2
    t.integer "executions_count"
    t.datetime "finished_at"
    t.boolean "is_discrete"
    t.text "job_class"
    t.text "labels", array: true
    t.datetime "locked_at"
    t.uuid "locked_by_id"
    t.datetime "performed_at"
    t.integer "priority"
    t.text "queue_name"
    t.uuid "retried_good_job_id"
    t.datetime "scheduled_at"
    t.jsonb "serialized_params"
    t.datetime "updated_at", null: false
    t.index ["active_job_id", "created_at"], name: "index_good_jobs_on_active_job_id_and_created_at"
    t.index ["batch_callback_id"], name: "index_good_jobs_on_batch_callback_id", where: "(batch_callback_id IS NOT NULL)"
    t.index ["batch_id"], name: "index_good_jobs_on_batch_id", where: "(batch_id IS NOT NULL)"
    t.index ["concurrency_key"], name: "index_good_jobs_on_concurrency_key_when_unfinished", where: "(finished_at IS NULL)"
    t.index ["cron_key", "created_at"], name: "index_good_jobs_on_cron_key_and_created_at_cond", where: "(cron_key IS NOT NULL)"
    t.index ["cron_key", "cron_at"], name: "index_good_jobs_on_cron_key_and_cron_at_cond", unique: true, where: "(cron_key IS NOT NULL)"
    t.index ["finished_at"], name: "index_good_jobs_jobs_on_finished_at", where: "((retried_good_job_id IS NULL) AND (finished_at IS NOT NULL))"
    t.index ["labels"], name: "index_good_jobs_on_labels", where: "(labels IS NOT NULL)", using: :gin
    t.index ["locked_by_id"], name: "index_good_jobs_on_locked_by_id", where: "(locked_by_id IS NOT NULL)"
    t.index ["priority", "created_at"], name: "index_good_job_jobs_for_candidate_lookup", where: "(finished_at IS NULL)"
    t.index ["priority", "created_at"], name: "index_good_jobs_jobs_on_priority_created_at_when_unfinished", order: { priority: "DESC NULLS LAST" }, where: "(finished_at IS NULL)"
    t.index ["priority", "scheduled_at"], name: "index_good_jobs_on_priority_scheduled_at_unfinished_unlocked", where: "((finished_at IS NULL) AND (locked_by_id IS NULL))"
    t.index ["queue_name", "scheduled_at"], name: "index_good_jobs_on_queue_name_and_scheduled_at", where: "(finished_at IS NULL)"
    t.index ["scheduled_at"], name: "index_good_jobs_on_scheduled_at", where: "(finished_at IS NULL)"
  end

  create_table "inline_comment_threads", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "document_id", null: false
    t.datetime "resolved_at"
    t.bigint "resolved_by"
    t.datetime "updated_at", null: false
    t.index ["document_id"], name: "index_inline_comment_threads_on_document_id"
  end

  create_table "inline_comments", id: :string, force: :cascade do |t|
    t.json "comment_attributes", default: ""
    t.string "content"
    t.datetime "created_at", null: false
    t.string "inline_comment_thread_id"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["inline_comment_thread_id"], name: "index_inline_comments_on_inline_comment_thread_id"
    t.index ["user_id"], name: "index_inline_comments_on_user_id"
  end

  create_table "invited_users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.text "first_name", default: "", null: false
    t.datetime "invitation_accepted_at"
    t.datetime "invitation_created_at"
    t.integer "invitation_limit"
    t.datetime "invitation_sent_at"
    t.string "invitation_token"
    t.integer "invitations_count", default: 0
    t.bigint "invited_by_id"
    t.string "invited_by_type"
    t.text "last_name", default: "", null: false
    t.bigint "organization_id"
    t.datetime "updated_at", null: false
    t.index ["email", "organization_id"], name: "index_invited_users_on_email_and_organization_id", unique: true
    t.index ["invitation_token"], name: "index_invited_users_on_invitation_token", unique: true
    t.index ["invited_by_id"], name: "index_invited_users_on_invited_by_id"
    t.index ["invited_by_type", "invited_by_id"], name: "index_invited_users_on_invited_by"
    t.index ["organization_id"], name: "index_invited_users_on_organization_id"
  end

  create_table "object_comments", force: :cascade do |t|
    t.json "content", null: false
    t.datetime "created_at", null: false
    t.bigint "object_id", null: false
    t.string "object_type", null: false
    t.bigint "organization_id", null: false
    t.bigint "organization_user_id", null: false
    t.datetime "updated_at", null: false
    t.index ["object_type", "object_id"], name: "index_object_comments_on_object"
    t.index ["organization_id"], name: "index_object_comments_on_organization_id"
    t.index ["organization_user_id"], name: "index_object_comments_on_organization_user_id"
  end

  create_table "object_reactions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "emoji", null: false
    t.bigint "object_id", null: false
    t.string "object_type", null: false
    t.bigint "organization_id", null: false
    t.bigint "organization_user_id", null: false
    t.index ["emoji", "object_id", "object_type", "organization_user_id"], name: "idx_on_emoji_object_id_object_type_organization_use_9a84494fac", unique: true
    t.index ["object_type", "object_id"], name: "index_object_reactions_on_object"
    t.index ["organization_id"], name: "index_object_reactions_on_organization_id"
    t.index ["organization_user_id"], name: "index_object_reactions_on_organization_user_id"
  end

  create_table "object_tags", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "object_id", null: false
    t.string "object_type", null: false
    t.bigint "organization_id", null: false
    t.string "tag_id", null: false
    t.datetime "updated_at", null: false
    t.index ["object_type", "object_id"], name: "index_object_tags_on_object"
    t.index ["organization_id"], name: "index_object_tags_on_organization_id"
    t.index ["tag_id", "object_type", "object_id"], name: "index_object_tags_on_tag_id_and_object_type_and_object_id", unique: true
    t.index ["tag_id"], name: "index_object_tags_on_tag_id"
  end

  create_table "object_visitors", force: :cascade do |t|
    t.bigint "object_id", null: false
    t.string "object_type", null: false
    t.bigint "user_id", null: false
    t.datetime "visited_at", null: false
    t.index ["object_id", "object_type", "user_id"], name: "idx_on_object_id_object_type_user_id", unique: true
    t.index ["object_type", "object_id"], name: "index_object_visitors_on_object"
    t.index ["user_id"], name: "index_object_visitors_on_user_id"
  end

  create_table "organization_user_properties", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "key", null: false
    t.bigint "organization_user_id", null: false
    t.datetime "updated_at", null: false
    t.jsonb "value", null: false
    t.index ["key", "organization_user_id"], name: "idx_on_key_organization_user_id_f0a3f857a8", unique: true
    t.index ["organization_user_id"], name: "index_organization_user_properties_on_organization_user_id"
  end

  create_table "organization_users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "npi", default: -> { "gen_random_uuid()" }, null: false
    t.bigint "organization_id"
    t.integer "role", limit: 2, default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["npi"], name: "index_organization_users_on_npi", unique: true
    t.index ["organization_id"], name: "index_organization_users_on_organization_id"
    t.index ["user_id", "organization_id"], name: "index_organization_users_on_user_id_and_organization_id", unique: true
  end

  create_table "organizations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.string "npi", default: -> { "gen_random_uuid()" }, null: false
    t.datetime "updated_at", null: false
    t.index ["npi"], name: "index_organizations_on_npi", unique: true
  end

  create_table "pack_versions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "description", default: "", null: false
    t.bigint "organization_id", null: false
    t.bigint "pack_id", null: false
    t.datetime "updated_at", null: false
    t.integer "version", null: false
    t.index ["organization_id"], name: "index_pack_versions_on_organization_id"
    t.index ["pack_id"], name: "index_pack_versions_on_pack_id"
  end

  create_table "packs", force: :cascade do |t|
    t.bigint "active_version_id"
    t.datetime "created_at", null: false
    t.string "description", default: "", null: false
    t.string "name", null: false
    t.string "npi", default: -> { "gen_random_uuid()" }, null: false
    t.bigint "organization_id", null: false
    t.datetime "updated_at", null: false
    t.index ["npi"], name: "index_packs_on_npi", unique: true
    t.index ["organization_id"], name: "index_packs_on_organization_id"
  end

  create_table "public_links", id: :string, force: :cascade do |t|
    t.text "allowed_emails", default: [], array: true
    t.datetime "created_at", null: false
    t.bigint "object_id", null: false
    t.string "object_type", null: false
    t.bigint "organization_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "updated_by_id", null: false
    t.index ["id"], name: "index_public_links_on_id", unique: true
    t.index ["object_id", "object_type", "organization_id"], name: "idx_on_object_id_object_type_organization_id_771a32f229", unique: true
    t.index ["object_type", "object_id"], name: "index_public_links_on_object"
    t.index ["organization_id"], name: "index_public_links_on_organization_id"
    t.index ["updated_by_id"], name: "index_public_links_on_updated_by_id"
  end

  create_table "space_memberships", force: :cascade do |t|
    t.string "member_id"
    t.string "member_type"
    t.bigint "organization_id", null: false
    t.integer "role", limit: 2, default: 0, null: false
    t.bigint "space_id"
    t.index ["member_id", "member_type", "space_id"], name: "idx_on_member_id_member_type_space_id_e2ffbf3808", unique: true
    t.index ["member_type", "member_id"], name: "index_space_managers_on_manager"
    t.index ["organization_id"], name: "index_space_memberships_on_organization_id"
    t.index ["space_id"], name: "index_space_memberships_on_space_id"
  end

  create_table "spaces", force: :cascade do |t|
    t.integer "access_mode", limit: 2, default: 0, null: false
    t.datetime "created_at", null: false
    t.json "hierarchy", default: [], null: false
    t.bigint "home_document_id"
    t.string "name"
    t.string "npi", default: -> { "gen_random_uuid()" }, null: false
    t.bigint "organization_id"
    t.datetime "updated_at", null: false
    t.index ["name", "organization_id"], name: "index_spaces_on_name_and_organization_id", unique: true
    t.index ["npi"], name: "index_spaces_on_npi", unique: true
    t.index ["organization_id"], name: "index_spaces_on_organization_id"
  end

  create_table "superintendents", force: :cascade do |t|
    t.datetime "approved_at"
    t.bigint "approved_by_id"
    t.datetime "confirmation_sent_at"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "created_at", null: false
    t.datetime "current_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.integer "failed_attempts", default: 0, null: false
    t.datetime "last_sign_in_at"
    t.string "last_sign_in_ip"
    t.datetime "locked_at"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "sign_in_count", default: 0, null: false
    t.string "unconfirmed_email"
    t.string "unlock_token"
    t.datetime "updated_at", null: false
    t.index ["approved_by_id"], name: "index_superintendents_on_approved_by_id"
    t.index ["confirmation_token"], name: "index_superintendents_on_confirmation_token", unique: true
    t.index ["email"], name: "index_superintendents_on_email", unique: true
    t.index ["reset_password_token"], name: "index_superintendents_on_reset_password_token", unique: true
    t.index ["unlock_token"], name: "index_superintendents_on_unlock_token", unique: true
  end

  create_table "table_cells", force: :cascade do |t|
    t.bigint "column_id", null: false
    t.datetime "created_at", null: false
    t.bigint "organization_id", null: false
    t.bigint "row_id", null: false
    t.bigint "table_id", null: false
    t.datetime "updated_at", null: false
    t.string "value"
    t.index ["column_id"], name: "index_table_cells_on_column_id"
    t.index ["organization_id"], name: "index_table_cells_on_organization_id"
    t.index ["row_id"], name: "index_table_cells_on_row_id"
    t.index ["table_id"], name: "index_table_cells_on_table_id"
  end

  create_table "table_columns", force: :cascade do |t|
    t.json "configuration"
    t.datetime "created_at", null: false
    t.text "formula"
    t.integer "kind", limit: 2, null: false
    t.string "name", null: false
    t.string "npi", default: -> { "gen_random_uuid()" }, null: false
    t.json "options"
    t.bigint "organization_id", null: false
    t.bigint "previous_column_id"
    t.bigint "table_id", null: false
    t.datetime "updated_at", null: false
    t.index ["name", "table_id"], name: "index_table_columns_on_name_and_table_id", unique: true
    t.index ["npi", "table_id"], name: "index_table_columns_on_npi_and_table_id", unique: true
    t.index ["organization_id"], name: "index_table_columns_on_organization_id"
    t.index ["previous_column_id"], name: "index_table_columns_on_previous_column_id"
    t.index ["table_id"], name: "index_table_columns_on_table_id"
  end

  create_table "table_rows", force: :cascade do |t|
    t.string "npi", default: -> { "gen_random_uuid()" }, null: false
    t.bigint "organization_id", null: false
    t.bigint "previous_row_id"
    t.bigint "table_id", null: false
    t.index ["npi", "table_id"], name: "index_table_rows_on_npi_and_table_id", unique: true
    t.index ["organization_id"], name: "index_table_rows_on_organization_id"
    t.index ["previous_row_id"], name: "index_table_rows_on_previous_row_id"
    t.index ["table_id"], name: "index_table_rows_on_table_id"
  end

  create_table "tables", force: :cascade do |t|
    t.boolean "archived", default: false, null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "npi", default: -> { "gen_random_uuid()" }, null: false
    t.bigint "organization_id", null: false
    t.bigint "parent_id", null: false
    t.string "parent_type", null: false
    t.bigint "space_id", null: false
    t.datetime "updated_at", null: false
    t.index ["name", "space_id"], name: "index_tables_on_name_and_space_id", unique: true
    t.index ["npi", "organization_id"], name: "index_tables_on_npi_and_organization_id", unique: true
    t.index ["organization_id"], name: "index_tables_on_organization_id"
    t.index ["parent_type", "parent_id"], name: "index_tables_on_parent"
    t.index ["space_id"], name: "index_tables_on_space_id"
  end

  create_table "tags", id: :string, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "color"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "organization_id", null: false
    t.bigint "space_id", null: false
    t.datetime "updated_at", null: false
    t.index ["id"], name: "index_tags_on_id", unique: true
    t.index ["name", "space_id"], name: "index_tags_on_name_and_space_id", unique: true
    t.index ["organization_id"], name: "index_tags_on_organization_id"
    t.index ["space_id"], name: "index_tags_on_space_id"
  end

  create_table "team_memberships", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "member_id", null: false
    t.string "member_type", null: false
    t.bigint "organization_id", null: false
    t.string "team_id", null: false
    t.datetime "updated_at", null: false
    t.index ["member_id", "member_type", "team_id"], name: "idx_on_member_id_member_type_team_id_fa57caa5d8", unique: true
    t.index ["member_type", "member_id"], name: "index_team_memberships_on_member"
    t.index ["organization_id"], name: "index_team_memberships_on_organization_id"
    t.index ["team_id"], name: "index_team_memberships_on_team_id"
  end

  create_table "teams", id: :string, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "organization_id", null: false
    t.string "shortcut", null: false
    t.datetime "updated_at", null: false
    t.index ["id"], name: "index_teams_on_id", unique: true
    t.index ["name", "organization_id"], name: "index_teams_on_name_and_organization_id", unique: true
    t.index ["organization_id"], name: "index_teams_on_organization_id"
    t.index ["shortcut", "organization_id"], name: "index_teams_on_shortcut_and_organization_id", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.datetime "confirmation_sent_at"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "created_at", null: false
    t.datetime "current_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.text "first_name"
    t.datetime "invitation_accepted_at"
    t.datetime "invitation_created_at"
    t.integer "invitation_limit"
    t.datetime "invitation_sent_at"
    t.string "invitation_token"
    t.integer "invitations_count", default: 0
    t.bigint "invited_by_id"
    t.string "invited_by_type"
    t.text "last_name"
    t.datetime "last_sign_in_at"
    t.string "last_sign_in_ip"
    t.integer "organization_role", limit: 2, default: 0, null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "sign_in_count", default: 0, null: false
    t.string "unconfirmed_email"
    t.datetime "updated_at", null: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["invitation_token"], name: "index_users_on_invitation_token", unique: true
    t.index ["invited_by_id"], name: "index_users_on_invited_by_id"
    t.index ["invited_by_type", "invited_by_id"], name: "index_organization_users_on_invited_by"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "versions", force: :cascade do |t|
    t.json "content_blocks"
    t.text "content_html", default: ""
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.bigint "document_id", null: false
    t.json "operations", default: ""
    t.json "revisions", default: ""
    t.integer "sequential_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_versions_on_created_by_id"
    t.index ["document_id"], name: "index_versions_on_document_id"
    t.index ["sequential_id", "document_id"], name: "index_versions_on_sequential_id_and_document_id", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "api_tokens", "organization_users"
  add_foreign_key "api_tokens", "organizations"
  add_foreign_key "attachments", "organizations"
  add_foreign_key "automation_invocations", "automations"
  add_foreign_key "automation_invocations", "organization_users", column: "run_as_id"
  add_foreign_key "automation_invocations", "organizations"
  add_foreign_key "automation_invocations", "spaces"
  add_foreign_key "automations", "organization_users", column: "run_as_id"
  add_foreign_key "automations", "organizations"
  add_foreign_key "automations", "spaces"
  add_foreign_key "document_imports", "documents"
  add_foreign_key "document_imports", "organization_users"
  add_foreign_key "document_imports", "organizations"
  add_foreign_key "document_imports", "spaces"
  add_foreign_key "documents", "organizations"
  add_foreign_key "documents", "spaces"
  add_foreign_key "favorites", "organization_users"
  add_foreign_key "inline_comment_threads", "documents"
  add_foreign_key "inline_comments", "users"
  add_foreign_key "invited_users", "organizations"
  add_foreign_key "object_comments", "organization_users"
  add_foreign_key "object_comments", "organizations"
  add_foreign_key "object_reactions", "organization_users"
  add_foreign_key "object_reactions", "organizations"
  add_foreign_key "object_tags", "organizations"
  add_foreign_key "object_tags", "tags"
  add_foreign_key "organization_user_properties", "organization_users"
  add_foreign_key "pack_versions", "organizations"
  add_foreign_key "pack_versions", "packs"
  add_foreign_key "packs", "organizations"
  add_foreign_key "packs", "pack_versions", column: "active_version_id"
  add_foreign_key "spaces", "documents", column: "home_document_id"
  add_foreign_key "spaces", "organizations"
  add_foreign_key "table_cells", "table_columns", column: "column_id"
  add_foreign_key "table_cells", "table_rows", column: "row_id"
  add_foreign_key "table_columns", "table_columns", column: "previous_column_id"
  add_foreign_key "table_rows", "table_rows", column: "previous_row_id"
  add_foreign_key "tags", "organizations"
  add_foreign_key "tags", "spaces"
  add_foreign_key "team_memberships", "organizations"
  add_foreign_key "team_memberships", "teams"
  add_foreign_key "teams", "organizations"
  add_foreign_key "versions", "documents"
  add_foreign_key "versions", "users", column: "created_by_id"
end
