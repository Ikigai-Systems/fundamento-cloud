require "json"

# Guards the move to Tabler icons. MIGRATION_PENDING lists files that may still use Font Awesome,
# Heroicons or pasted SVGs; each migration PR deletes the entries it clears.
module IconUsageGuard
  ROOT = File.expand_path("../..", __dir__)

  MIGRATION_PENDING = [
    "app/assets/stylesheets/multiselect.css",
  ].freeze

  ALLOWED_SVG_FILES = [
    "app/views/devise/shared/_google_auth_button.html.erb",
    # Rewrites the imported Tabler <svg tag to add the class and part ninja-keys needs.
    "app/javascript/stimulus/controllers/command_palette_icons.js",
  ].freeze

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
