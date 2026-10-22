require_relative "../../bin/lib/worktree"
require "tmpdir"

RSpec.describe Worktree do
  around do |example|
    Dir.mktmpdir("worktree-spec") do |dir|
      @tmp = File.realpath(dir)
      example.run
    end
  end

  def sh(dir, *command)
    _out, err, status = Open3.capture3(*command, chdir: dir)
    raise "#{command.join(" ")} failed: #{err}" unless status.success?
  end

  def create_repo
    main = File.join(@tmp, "main")
    FileUtils.mkdir_p(main)
    sh(main, "git", "init", "-q", "-b", "master")
    sh(main, "git", "-c", "user.name=t", "-c", "user.email=t@example.com", "-c", "commit.gpgsign=false", "commit", "-q", "--allow-empty", "-m", "init")
    main
  end

  def add_worktree(main, name)
    path = File.join(main, ".claude", "worktrees", name)
    sh(main, "git", "worktree", "add", "-q", "-b", name, path)
    path
  end

  describe ".sanitize" do
    it "keeps lowercase letters, digits and single underscores" do
      expect(Worktree.sanitize("Bright-Running.Fox")).to eq("bright_running_fox")
      expect(Worktree.sanitize("--pr-1234--")).to eq("pr_1234")
    end

    it "shortens long names to a unique id within the length limit" do
      long_a = "a-very-long-worktree-name-that-goes-on-and-on-one"
      long_b = "a-very-long-worktree-name-that-goes-on-and-on-two"

      expect(Worktree.sanitize(long_a).length).to be <= Worktree::MAX_ID_LENGTH
      expect(Worktree.sanitize(long_a)).not_to eq(Worktree.sanitize(long_b))
    end
  end

  describe Worktree::Context do
    it "recognises the main checkout, which has no id" do
      main = create_repo
      context = Worktree::Context.detect(main)

      expect(context).to be_main
      expect(context.id).to be_nil
    end

    it "recognises a linked worktree and finds the main checkout from a subdirectory" do
      main = create_repo
      worktree = add_worktree(main, "Feature-X")
      FileUtils.mkdir_p(File.join(worktree, "app"))

      context = Worktree::Context.detect(File.join(worktree, "app"))

      expect(context).not_to be_main
      expect(context.root).to eq(worktree)
      expect(context.main_root).to eq(main)
      expect(context.id).to eq("feature_x")
    end
  end

  describe ".copy_included_files" do
    it "copies missing files matched by .worktreeinclude and leaves existing ones alone" do
      main = create_repo
      worktree = add_worktree(main, "copy")
      File.write(File.join(worktree, ".worktreeinclude"), "# comment\n\n.env\nconfig/credentials/*.key\n.bundle/config\n")
      File.write(File.join(main, ".env"), "FROM_MAIN=1")
      FileUtils.mkdir_p(File.join(main, "config", "credentials"))
      File.write(File.join(main, "config", "credentials", "test.key"), "secret")
      File.write(File.join(worktree, ".env"), "LOCAL=1")

      copied = Worktree.copy_included_files(Worktree::Context.detect(worktree))

      expect(copied).to eq(["config/credentials/test.key"])
      expect(File.read(File.join(worktree, "config", "credentials", "test.key"))).to eq("secret")
      expect(File.read(File.join(worktree, ".env"))).to eq("LOCAL=1")
    end

    it "copies nothing in the main checkout" do
      main = create_repo
      File.write(File.join(main, ".worktreeinclude"), ".env\n")
      File.write(File.join(main, ".env"), "X=1")

      expect(Worktree.copy_included_files(Worktree::Context.detect(main))).to eq([])
    end
  end

  describe Worktree::Stamp do
    it "is current only until one of its inputs changes" do
      File.write(File.join(@tmp, "package-lock.json"), "v1")
      stamp = Worktree::Stamp.new(@tmp, "npm", ["package-lock.json"])

      expect(stamp).not_to be_current
      stamp.write!
      expect(Worktree::Stamp.new(@tmp, "npm", ["package-lock.json"])).to be_current

      File.write(File.join(@tmp, "package-lock.json"), "v2")
      expect(Worktree::Stamp.new(@tmp, "npm", ["package-lock.json"])).not_to be_current
    end

    it "notices files added under a glob" do
      FileUtils.mkdir_p(File.join(@tmp, "src"))
      File.write(File.join(@tmp, "src", "a.ts"), "a")
      Worktree::Stamp.new(@tmp, "build", ["src/**/*"]).write!

      File.write(File.join(@tmp, "src", "b.ts"), "b")

      expect(Worktree::Stamp.new(@tmp, "build", ["src/**/*"])).not_to be_current
    end
  end

  describe ".database_yml" do
    let(:sample) do
      <<~YML
        default: &default
          adapter: postgresql

        development:
          <<: *default
          database: fundamento_development

        # A comment between sections
        test:
          <<: *default
          database: fundamento_test
      YML
    end

    it "points the given sections at the worktree's databases and leaves the rest alone" do
      yml = Worktree.database_yml(sample, {"test" => "fundamento_test_wt_x"})

      expect(yml).to include("database: fundamento_test_wt_x")
      expect(yml).to include("database: fundamento_development")
      expect(yml).not_to include("database: fundamento_test\n")
    end

    it "returns the sample unchanged for the main checkout" do
      expect(Worktree.database_yml(sample, {})).to eq(sample)
    end

    it "fails when the sample has no database line to replace" do
      expect { Worktree.database_yml(sample, {"standalone" => "x"}) }.to raise_error(Worktree::Error, /standalone/)
    end
  end

  describe "database names" do
    it "marks worktree databases and keeps the main checkout's names" do
      main = create_repo
      worktree = add_worktree(main, "feature")

      expect(Worktree::Context.detect(main).own_databases).to eq({})
      expect(Worktree::Context.detect(main).development_database).to eq("fundamento_development")
      expect(Worktree::Context.detect(worktree).own_databases).to eq(
        "development" => "fundamento_development_wt_feature",
        "test" => "fundamento_test_wt_feature"
      )
      expect("fundamento_development_wt_feature").to match(Worktree::WORKTREE_DATABASE)
      expect("fundamento_development").not_to match(Worktree::WORKTREE_DATABASE)
    end
  end

  describe "#live_worktree_paths" do
    it "leaves out worktrees whose directory was deleted" do
      main = create_repo
      kept = add_worktree(main, "kept")
      deleted = add_worktree(main, "deleted")
      FileUtils.rm_rf(deleted)

      expect(Worktree::Context.detect(main).live_worktree_paths).to contain_exactly(main, kept)
    end
  end

  describe Worktree::Registry do
    it "records each worktree's databases and reports the ones whose worktree is gone" do
      main = create_repo
      kept = add_worktree(main, "kept")
      gone = add_worktree(main, "gone")
      Worktree::Context.detect(kept).registry.register(Worktree::Context.detect(kept))
      Worktree::Context.detect(gone).registry.register(Worktree::Context.detect(gone))
      sh(main, "git", "worktree", "remove", gone)

      context = Worktree::Context.detect(main)
      orphans = context.registry.orphans(context.live_worktree_paths)

      expect(context.registry.entries[kept]).to eq(
        "id" => "kept", "databases" => %w[fundamento_development_wt_kept fundamento_test_wt_kept],
        "redis_key_prefix" => "wt_kept:", "slot" => 1, "e2e_project" => "fundamento-e2e-wt-kept"
      )
      expect(orphans.keys).to eq([gone])
    end

    it "gives each worktree the lowest free slot, keeps it, and reuses it once the worktree is gone" do
      main = create_repo
      first = add_worktree(main, "first")
      second = add_worktree(main, "second")
      registry = Worktree::Context.detect(main).registry

      expect(registry.register(Worktree::Context.detect(first))["slot"]).to eq(1)
      expect(registry.register(Worktree::Context.detect(second))["slot"]).to eq(2)
      expect(registry.register(Worktree::Context.detect(first))["slot"]).to eq(1)
      expect(registry.entries[second]["redis_key_prefix"]).to eq("wt_second:")

      registry.remove(first)
      third = add_worktree(main, "third")
      expect(registry.register(Worktree::Context.detect(third))["slot"]).to eq(1)
      expect(Worktree::Context.detect(third).ports).to eq("rails" => 20_010, "vite" => 20_011, "blocknote" => 20_012)
      expect(Worktree::Context.detect(third).e2e_ports).to include("rails" => 22_010, "postgres" => 22_011)
    end

    it "refuses a second live worktree with the same id" do
      main = create_repo
      first = add_worktree(main, "same")
      second = File.join(main, "other", "same")
      sh(main, "git", "worktree", "add", "-q", "-b", "same-2", second)
      Worktree::Context.detect(first).registry.register(Worktree::Context.detect(first))

      expect { Worktree::Context.detect(second).registry.register(Worktree::Context.detect(second)) }
        .to raise_error(Worktree::Error, /already uses the id same/)
    end
  end

  describe "ports and env file" do
    it "keeps today's ports and no Redis prefix in the main checkout" do
      context = Worktree::Context.detect(create_repo)

      expect(context.ports).to eq("rails" => 3000, "vite" => 3036, "blocknote" => 3002)
      expect(context.redis_key_prefix).to eq("")
      expect(context.e2e_project).to eq("e2e-tests")
      expect(context.e2e_ports).to include("rails" => 4000, "postgres" => 6432, "redis" => 7379, "minio" => 10_000)
    end

    it "gives a worktree its own E2E project, and no E2E ports before it has a slot" do
      worktree = add_worktree(create_repo, "Feature-X")
      context = Worktree::Context.detect(worktree)

      expect(context.e2e_project).to eq("fundamento-e2e-wt-feature_x")
      expect(context.e2e_ports).to be_nil
    end

    it "gives slots non-overlapping port blocks below the ephemeral range" do
      blocks = (1..Worktree::MAX_SLOTS).map do |slot|
        Worktree.ports(slot).values + Worktree.debug_ports(slot).to_a + Worktree.e2e_ports(slot).values
      end
      fixed = Worktree::DEFAULT_PORTS.values + Worktree::DEFAULT_E2E_PORTS.values + [3037, 5432, 6379, 9000, 9001]

      expect(blocks.flatten.uniq.size).to eq(blocks.flatten.size)
      expect(blocks.flatten.max).to be < 32_768
      expect(blocks.flatten & (fixed + (9200..9299).to_a)).to be_empty
    end

    it "writes an env file that reads back with the worktree's values" do
      path = File.join(@tmp, ".env.development.local")
      File.write(path, Worktree.env_file(ports: Worktree.ports(3), redis_key_prefix: "wt_x:"))

      expect(Worktree.read_env(path)).to eq(
        "PORT" => "20030", "HTTP_HOST" => "localhost:20030", "VITE_RUBY_PORT" => "20031",
        "BLOCKNOTE_PORT" => "20032", "REDIS_KEY_PREFIX" => "wt_x:"
      )
    end
  end

  describe Worktree::E2EStack do
    it "refuses any Compose project but a worktree's E2E project" do
      expect { Worktree::E2EStack.new("e2e-tests") }.to raise_error(Worktree::Error, /Refusing/)
      expect { Worktree::E2EStack.new("fundamento-cloud") }.to raise_error(Worktree::Error, /Refusing/)
      expect { Worktree::E2EStack.new(Worktree.e2e_project("feature_x")) }.not_to raise_error
    end
  end

  describe Worktree::RedisServer do
    it "deletes only the keys under a worktree prefix, and refuses any other prefix" do
      redis = Worktree::RedisServer.new(ENV.fetch("REDIS_URL", "redis://127.0.0.1:6379"))
      raw = Redis.new(url: ENV.fetch("REDIS_URL", "redis://127.0.0.1:6379"))
      prefix = "wt_spec_#{Process.pid}:"
      kept = ["wt_spec_#{Process.pid}x:a", "spec_#{Process.pid}:b"]
      (["#{prefix}a", "#{prefix}npn:development:cache:b"] + kept).each { |key| raw.set(key, "1") }

      expect(redis.delete_prefix(prefix)).to eq(2)
      expect(raw.exists(*kept)).to eq(2)
      expect { redis.delete_prefix("") }.to raise_error(Worktree::Error, /Refusing/)
      expect { redis.delete_prefix("npn:") }.to raise_error(Worktree::Error, /Refusing/)
    ensure
      raw&.del(*kept) if kept
      redis&.close
      raw&.close
    end
  end

  describe Worktree::Server do
    it "reads connection details from a database.yml section" do
      secret = "a@b"
      url = "postgres://user:#{URI.encode_www_form_component(secret)}@db.local:6543/app"
      params = Worktree::Server.connection_params("url" => url)

      expect(params).to eq(host: "db.local", port: 6543, user: "user", password: secret, dbname: "postgres")
    end

    it "creates, finds and drops worktree databases, and refuses any other" do
      url = ENV.fetch("DATABASE_URL", "postgres://postgres:password@localhost")
      server = Worktree::Server.new(Worktree::Server.connection_params("url" => url))
      name = "fundamento_test_wt_spec_#{Process.pid}"

      PG.connect(Worktree::Server.connection_params("url" => url)) { |pg| pg.exec("CREATE DATABASE #{name}") }
      expect(server.exists?(name)).to be(true)

      server.drop(name)
      expect(server.exists?(name)).to be(false)
      expect { server.drop("fundamento_test") }.to raise_error(Worktree::Error, /Refusing/)
    ensure
      server&.close
    end
  end
end
