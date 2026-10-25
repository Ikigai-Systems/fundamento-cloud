require "json"

# Guards the move to Tabler icons. MIGRATION_PENDING lists files that may still use Font Awesome,
# Heroicons or pasted SVGs; each migration PR deletes the entries it clears.
module IconUsageGuard
  ROOT = File.expand_path("../..", __dir__)

  MIGRATION_PENDING = [
    "app/assets/stylesheets/multiselect.css",
    "app/components/button_group_component.html.erb",
    "app/javascript/components/SelectButton.tsx",
    "app/javascript/components/editor/LoadingContent.tsx",
    "app/javascript/components/editor/blocks/AdvancedTable.tsx",
    "app/javascript/components/editor/blocks/AdvancedTableMenuItem.tsx",
    "app/javascript/components/editor/blocks/ChartBlock.tsx",
    "app/javascript/components/editor/blocks/ChartBlockMenuItem.tsx",
    "app/javascript/components/editor/blocks/CodeBlockMenuItem.tsx",
    "app/javascript/components/editor/inline-content/ButtonInlineContent.tsx",
    "app/javascript/components/editor/inline-content/ButtonInlineContentMenuItem.tsx",
    "app/javascript/components/editor/inline-content/FormulaInlineContent.tsx",
    "app/javascript/components/editor/inline-content/FormulaInlineContentMenuItem.tsx",
    "app/javascript/components/editor/inline-content/MentionInlineContent.tsx",
    "app/javascript/components/editor/inline-content/button/SelectButtonColor.tsx",
    "app/javascript/components/editor/inline-content/button/SelectButtonSize.tsx",
    "app/javascript/components/editor/inline-content/mentionMenuItems.tsx",
    "app/javascript/components/spinners/Spinner.tsx",
    "app/javascript/components/tables/EditableTableWithRowstack.tsx",
    "app/javascript/components/tables/rowstack/DateTimeCell/CalendarDaysIcon.tsx",
    "app/javascript/components/tables/rowstack/EditFormulaPopup.tsx",
    "app/javascript/components/tables/rowstack/MultiPeopleSelectCell.tsx",
    "app/javascript/components/tables/rowstack/PeopleSelectCell.tsx",
    "app/javascript/stimulus/controllers/command_palette_controller.js",
    "app/javascript/stimulus/controllers/flash_manager_controller.ts",
    "app/javascript/stimulus/controllers/timestamp_controller.ts",
    "app/views/ai_assistants/show.html.erb",
    "app/views/api_tokens/_create.html.erb",
    "app/views/application/_flash_messages.html.erb",
    "app/views/application/_left_sidebar.html.erb",
    "app/views/application/_notifications_menu.html.erb",
    "app/views/application/_right_sidebar.html.erb",
    "app/views/application/_search_button.html.erb",
    "app/views/application/_spaces_menu.html.erb",
    "app/views/application/components/button_group.html.erb",
    "app/views/devise/confirmations/pending.html.erb",
    "app/views/devise/registrations/new.html.erb",
    "app/views/documents/edit.html.erb",
    "app/views/documents/show.html.erb",
    "app/views/doorkeeper/authorizations/new.html.erb",
    "app/views/layouts/_body.html.erb",
    "app/views/mentions/_mentions_tab.html.erb",
    "app/views/organization_memberships/_change_password_form.html.erb",
    "app/views/root/index.html.erb",
    "app/views/root/notifications.html.erb",
    "app/views/root/recently_updated.html.erb",
    "app/views/root/shared.html.erb",
    "app/views/tables/show.html.erb",
  ].freeze

  ALLOWED_SVG_FILES = ["app/views/devise/shared/_google_auth_button.html.erb"].freeze

  # PR 9 removes this exception together with the stylesheet's Font Awesome rules.
  STYLESHEET_EXCEPTIONS = ["app/assets/stylesheets/application.css.scss"].freeze

  ICON_DIRS = %w[app/views app/components app/helpers app/javascript app/assets/stylesheets].freeze
  SVG_DIRS = %w[app/views app/components app/javascript].freeze

  FONT_AWESOME = /(?<![\w-])fa-[a-z0-9-]+/
  HEROICONS = /heroicons--/
  INLINE_SVG = /<svg/
  DATA_SVG = /data:image\/svg\+xml/
  TABLER_CLASS = /icon-\[tabler--([a-z0-9-]+)\]/
  TABLER_IMPORT = %r{@tabler/icons/(outline|filled)/([a-z0-9-]+)\.svg}

  module_function

  def files_in(dirs)
    dirs.flat_map { |dir| Dir.glob(File.join(ROOT, dir, "**", "*")) }
      .select { |path| File.file?(path) }
      .reject { |path| path.include?("/app/assets/builds/") }
      .map { |path| path.delete_prefix("#{ROOT}/") }
      .sort
  end

  def offences(dirs, pattern, skip: [])
    (files_in(dirs) - skip).flat_map { |file| matches(file, pattern) }
  end

  def matches(file, pattern)
    File.foreach(File.join(ROOT, file), chomp: true).each_with_index.filter_map do |line, index|
      "#{file}:#{index + 1}" if line.valid_encoding? && line.match?(pattern)
    end
  end

  def pending_offences(file)
    [
      FONT_AWESOME, HEROICONS, INLINE_SVG, DATA_SVG
    ].any? { |pattern| matches(file, pattern).any? }
  end
end

RSpec.describe "Icon usage" do
  let(:guard) { IconUsageGuard }
  let(:pending_files) { guard::MIGRATION_PENDING }

  it "uses no Font Awesome classes" do
    skip = pending_files + guard::STYLESHEET_EXCEPTIONS
    expect(guard.offences(guard::ICON_DIRS, guard::FONT_AWESOME, skip: skip)).to be_empty
  end

  it "uses no Heroicons" do
    expect(guard.offences(guard::ICON_DIRS, guard::HEROICONS, skip: pending_files)).to be_empty
  end

  it "has no hand-pasted icon SVGs" do
    skip = pending_files + guard::ALLOWED_SVG_FILES
    offenders = guard.offences(guard::SVG_DIRS, guard::INLINE_SVG, skip: skip) +
      guard.offences(["app/assets/stylesheets"], guard::DATA_SVG, skip: skip)
    expect(offenders).to be_empty
  end

  it "references only Tabler icons that exist" do
    icons_path = File.join(guard::ROOT, "node_modules/@iconify-json/tabler/icons.json")
    data = JSON.parse(File.read(icons_path))
    known = data["icons"].keys + data.fetch("aliases", {}).keys
    icon_dir = File.join(guard::ROOT, "node_modules/@tabler/icons/icons")

    unknown_classes = guard.files_in(guard::ICON_DIRS).flat_map do |file|
      File.foreach(File.join(guard::ROOT, file), chomp: true).each_with_index.flat_map do |line, index|
        next [] unless line.valid_encoding?

        line.scan(guard::TABLER_CLASS).flatten.reject { |name| known.include?(name) }
          .map { |name| "#{file}:#{index + 1} icon-[tabler--#{name}]" }
      end
    end

    missing_imports = guard.files_in(guard::ICON_DIRS).flat_map do |file|
      File.foreach(File.join(guard::ROOT, file), chomp: true).each_with_index.flat_map do |line, index|
        next [] unless line.valid_encoding?

        line.scan(guard::TABLER_IMPORT).reject { |style, name| File.exist?(File.join(icon_dir, style, "#{name}.svg")) }
          .map { |style, name| "#{file}:#{index + 1} @tabler/icons/#{style}/#{name}.svg" }
      end
    end

    expect(unknown_classes + missing_imports).to be_empty
  end

  it "lists only files that still need migrating" do
    missing = pending_files.reject { |file| File.exist?(File.join(guard::ROOT, file)) }
    clean = pending_files.select { |file| File.exist?(File.join(guard::ROOT, file)) && !guard.pending_offences(file) }

    expect(missing).to be_empty, "MIGRATION_PENDING lists missing files: #{missing.join(", ")}"
    expect(clean).to be_empty, "MIGRATION_PENDING lists migrated files: #{clean.join(", ")}"
  end
end
