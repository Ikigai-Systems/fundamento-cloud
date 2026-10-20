# Logic behind bin/worktree, kept free of Rails and Bundler: the command has to run in a fresh
# worktree before `bundle install`, and the specs load it with spec_helper alone.
require "digest"
require "fileutils"
require "open3"

module Worktree
  # Where a checkout is and whether it is the main one. The main checkout keeps today's
  # values everywhere; only linked worktrees (`git worktree add`, Claude's --worktree,
  # remote-control sessions) get their own.
  class Context
    attr_reader :root, :main_root

    def self.detect(dir = Dir.pwd)
      root = git(dir, "rev-parse", "--show-toplevel")
      common_dir = git(dir, "rev-parse", "--path-format=absolute", "--git-common-dir")
      new(root: root, main_root: File.dirname(common_dir))
    end

    def self.git(dir, *args)
      out, status = Open3.capture2("git", "-C", dir, *args)
      raise "git #{args.join(" ")} failed in #{dir}" unless status.success?
      out.strip
    end

    def initialize(root:, main_root:)
      @root = File.realpath(root)
      @main_root = File.realpath(main_root)
    end

    def main?
      root == main_root
    end

    # A short identifier for naming per-worktree resources; nil for the main checkout.
    def id
      Worktree.sanitize(File.basename(root)) unless main?
    end
  end

  MAX_ID_LENGTH = 30

  # Lowercase [a-z0-9_] only, so the id is safe in database names (Postgres caps identifiers
  # at 63 bytes) and Compose project names. Long names keep a hash suffix to stay unique.
  def self.sanitize(name)
    id = name.downcase.gsub(/[^a-z0-9]+/, "_").gsub(/\A_+|_+\z/, "")
    return id if id.length <= MAX_ID_LENGTH

    "#{id[0, MAX_ID_LENGTH - 9].chomp("_")}_#{Digest::SHA256.hexdigest(name)[0, 8]}"
  end

  # Patterns from .worktreeinclude, the file Claude Code also reads when it creates a worktree.
  # Only plain paths and globs are supported (no negation), which is all the file uses.
  def self.include_patterns(root)
    path = File.join(root, ".worktreeinclude")
    return [] unless File.exist?(path)

    File.readlines(path, chomp: true).map(&:strip).reject { |line| line.empty? || line.start_with?("#") }
  end

  # Copies files matched by .worktreeinclude from the main checkout when they are missing here.
  # Claude Code does this itself for worktrees it creates; this covers `git worktree add` and
  # anything else. Existing files are never overwritten. Returns the copied relative paths.
  def self.copy_included_files(context)
    return [] if context.main?

    include_patterns(context.root).flat_map do |pattern|
      Dir.glob(pattern, File::FNM_DOTMATCH, base: context.main_root).filter_map do |relative|
        source = File.join(context.main_root, relative)
        target = File.join(context.root, relative)
        next unless File.file?(source)
        next if File.exist?(target)

        FileUtils.mkdir_p(File.dirname(target))
        FileUtils.cp(source, target, preserve: true)
        relative
      end
    end
  end

  # Remembers a digest of a step's inputs, so `setup` reruns a step only when they change.
  class Stamp
    def initialize(root, name, inputs)
      @root = root
      @path = File.join(root, "tmp", "worktree", "#{name}.stamp")
      @inputs = inputs
    end

    def current?
      File.exist?(@path) && File.read(@path) == digest
    end

    def write!
      FileUtils.mkdir_p(File.dirname(@path))
      File.write(@path, digest)
    end

    def digest
      files = @inputs.flat_map { |pattern| Dir.glob(pattern, base: @root) }.uniq.sort
      Digest::SHA256.hexdigest(files.map do |file|
        path = File.join(@root, file)
        "#{file}\0#{File.file?(path) ? Digest::SHA256.file(path).hexdigest : "-"}"
      end.join("\n"))
    end
  end
end
