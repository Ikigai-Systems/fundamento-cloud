require "json"

# Guards against Font Awesome, Heroicons and hand-pasted SVGs: icons come from Tabler.
module IconUsageGuard
  ROOT = File.expand_path("../..", __dir__)

  ALLOWED_SVG_FILES = [
    "app/views/devise/shared/_google_auth_button.html.erb",
    # Rewrites the imported Tabler <svg tag to add the class and part ninja-keys needs.
    "app/javascript/stimulus/controllers/command_palette_icons.js",
    # A CSS background can't use a mask class, and the SVG is Tabler's chevron-down.
    "app/assets/stylesheets/multiselect.css",
  ].freeze

  ICON_DIRS = %w[app/views app/components app/helpers app/javascript app/assets/stylesheets].freeze
  SVG_DIRS = %w[app/views app/components app/javascript].freeze

  FA_CLASS = /(?<![\w-])fa-[a-z0-9-]+/
  # The Pro gem and its token are gone: nothing in the build may name them again.
  FA_BUILD = /font[\s_-]?awesome/i
  BUILD_FILES = %w[Gemfile Gemfile.lock Dockerfile docker-compose.yml].freeze
  BUILD_GLOBS = %w[.github/**/* bin/**/*].freeze
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
end

RSpec.describe "Icon usage" do
  let(:guard) { IconUsageGuard }

  it "uses no Font Awesome classes" do
    expect(guard.offences(guard::ICON_DIRS, guard::FA_CLASS)).to be_empty
  end

  it "has no Font Awesome in the build" do
    globbed = guard::BUILD_GLOBS.flat_map { |glob| Dir.glob(File.join(guard::ROOT, glob), File::FNM_DOTMATCH) }
      .select { |path| File.file?(path) }
      .map { |path| path.delete_prefix("#{guard::ROOT}/") }
    files = (guard::BUILD_FILES + globbed).uniq.select { |file| File.file?(File.join(guard::ROOT, file)) }
    expect(files.flat_map { |file| guard.matches(file, guard::FA_BUILD) }).to be_empty
  end

  it "uses no Heroicons" do
    expect(guard.offences(guard::ICON_DIRS, guard::HEROICONS)).to be_empty

    package = JSON.parse(File.read(File.join(guard::ROOT, "package.json")))
    %w[dependencies devDependencies].each do |group|
      expect(package.fetch(group, {})).not_to include("@iconify-json/heroicons")
    end
  end

  it "has no hand-pasted icon SVGs" do
    skip = guard::ALLOWED_SVG_FILES
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
end
