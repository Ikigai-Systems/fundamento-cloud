# Logic behind bin/worktree, kept free of Rails and Bundler: the command has to run in a fresh
# worktree before `bundle install`, and the specs load it with spec_helper alone.
require "digest"
require "erb"
require "fileutils"
require "json"
require "open3"
require "uri"
require "yaml"

module Worktree
  class Error < StandardError; end

  # Where a checkout is and whether it is the main one. The main checkout keeps today's
  # values everywhere; only linked worktrees (`git worktree add`, Claude's --worktree,
  # remote-control sessions) get their own.
  class Context
    attr_reader :root, :main_root, :common_dir

    def self.detect(dir = Dir.pwd)
      root = git(dir, "rev-parse", "--show-toplevel")
      common_dir = git(dir, "rev-parse", "--path-format=absolute", "--git-common-dir")
      new(root: root, common_dir: common_dir)
    end

    def self.git(dir, *args)
      out, status = Open3.capture2("git", "-C", dir, *args)
      raise Error, "git #{args.join(" ")} failed in #{dir}" unless status.success?
      out.strip
    end

    def initialize(root:, common_dir:)
      @root = File.realpath(root)
      @common_dir = File.realpath(common_dir)
      @main_root = File.dirname(@common_dir)
    end

    def main?
      root == main_root
    end

    # A short identifier for naming per-worktree resources; nil for the main checkout.
    def id
      Worktree.sanitize(File.basename(root)) unless main?
    end

    def development_database
      Worktree.database_name("development", id)
    end

    def test_database
      Worktree.database_name("test", id)
    end

    # Databases this checkout uses that the main checkout doesn't share, keyed by the
    # database.yml section they replace.
    def own_databases
      main? ? {} : {"development" => development_database, "test" => test_database}
    end

    # One registry per clone, in the git directory all its worktrees share.
    def registry
      Registry.new(File.join(common_dir, "fundamento-worktrees.json"))
    end

    # Absolute paths of the worktrees git still knows about and that exist on disk.
    def live_worktree_paths
      self.class.git(main_root, "worktree", "list", "--porcelain").split("\n\n").filter_map do |block|
        lines = block.lines.map(&:chomp)
        path = lines.find { |line| line.start_with?("worktree ") }&.delete_prefix("worktree ")
        next if path.nil? || lines.any? { |line| line.start_with?("prunable") } || !File.directory?(path)

        File.realpath(path)
      end
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

  # The `wt_` marker is what makes a database safe for `gc` and `teardown` to drop.
  WORKTREE_DATABASE = /\Afundamento_(?:test|development)_wt_[a-z0-9_]+\z/

  def self.database_name(kind, id)
    id ? "fundamento_#{kind}_wt_#{id}" : "fundamento_#{kind}"
  end

  # database.yml for a checkout: the sample, with the `database:` line of each section in
  # `databases` pointing at this worktree's own database.
  def self.database_yml(sample, databases)
    section = nil
    replaced = []
    yml = sample.lines.map do |line|
      section = line[/\A([a-z_]+):/, 1] || section
      name = databases[section]
      next line unless name && line.match?(/\A\s+database:\s/)

      replaced << section
      line.sub(/database:.*/, "database: #{name}")
    end.join

    missing = databases.keys - replaced
    raise Error, "No `database:` line in the #{missing.join(", ")} section of the sample" if missing.any?

    yml
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

  # Which resources each worktree of this clone created, keyed by the worktree's absolute
  # path. `gc` drops what is recorded here for worktrees that are gone, so resources made by
  # another clone sharing the same Postgres server are never touched.
  class Registry
    def initialize(path)
      @path = path
    end

    def entries
      File.exist?(@path) ? JSON.parse(File.read(@path)) : {}
    end

    # Read-modify-write under an exclusive lock, so worktrees set up at the same time
    # don't overwrite each other's entries.
    def update
      File.open("#{@path}.lock", File::RDWR | File::CREAT, 0o644) do |lock|
        lock.flock(File::LOCK_EX)
        data = entries
        result = yield data
        tmp = "#{@path}.#{Process.pid}.tmp"
        File.write(tmp, "#{JSON.pretty_generate(data)}\n")
        File.rename(tmp, @path)
        result
      end
    end

    def register(context)
      update do |data|
        clash = data.find { |path, entry| path != context.root && entry["id"] == context.id }
        if clash && File.directory?(clash.first)
          raise Error, "#{clash.first} already uses the id #{context.id}; give this worktree another directory name"
        end

        entry = data[context.root] ||= {"id" => context.id, "databases" => []}
        entry["databases"] = (entry["databases"] | context.own_databases.values).sort
      end
    end

    # Entries whose worktree no longer exists.
    def orphans(live_paths)
      entries.reject { |path, _| live_paths.include?(path) }
    end

    def remove(path)
      update { |data| data.delete(path) }
    end
  end

  # The Postgres server a checkout's database.yml points at, reached through the `pg` gem
  # without Bundler. Server-wide work (listing, dropping) goes through the `postgres` database.
  class Server
    def self.for(root, section: "test")
      config = load_config(File.join(root, "config", "database.yml")).fetch(section)
      new(connection_params(config))
    end

    def self.load_config(path)
      raise Error, "#{path} is missing; run bin/worktree config" unless File.exist?(path)

      YAML.safe_load(ERB.new(File.read(path)).result, aliases: true)
    end

    def self.connection_params(config)
      params = {}
      if config["url"]
        uri = URI.parse(config["url"])
        params.merge!(host: uri.host, port: uri.port, user: uri.user, password: uri.password)
        params.transform_values! { |value| value.is_a?(String) ? URI.decode_www_form_component(value) : value }
      end
      params[:host] = config["host"] if config["host"]
      params[:port] = config["port"] if config["port"]
      params[:user] = config["username"] if config["username"]
      params[:password] = config["password"] if config["password"]
      params.compact.merge(dbname: "postgres")
    end

    def initialize(params)
      require "pg"
      @connection = PG.connect(params)
    rescue PG::ConnectionBad => e
      raise Error, "Can't reach Postgres (#{e.message.lines.first&.strip}). " \
                   "Start it from the main checkout: docker compose up -d --wait postgresql"
    end

    def databases
      @connection.exec("SELECT datname FROM pg_database ORDER BY datname").map { |row| row["datname"] }
    end

    def exists?(name)
      @connection.exec_params("SELECT 1 FROM pg_database WHERE datname = $1", [name]).ntuples == 1
    end

    # Only databases carrying the worktree marker can be dropped, whatever the caller passes.
    def drop(name)
      raise Error, "Refusing to drop #{name}: not a worktree database" unless name.match?(WORKTREE_DATABASE)

      @connection.exec("DROP DATABASE IF EXISTS #{@connection.quote_ident(name)} WITH (FORCE)")
    end

    def close
      @connection.close
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

    def delete!
      FileUtils.rm_f(@path)
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
