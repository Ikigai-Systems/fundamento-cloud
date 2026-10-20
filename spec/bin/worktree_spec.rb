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
end
