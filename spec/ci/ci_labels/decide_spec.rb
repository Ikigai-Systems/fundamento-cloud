require_relative "../../../.github/actions/ci-labels/lib/ci_labels"

RSpec.describe CiLabels::Decide do
  class FakeGitHub
    attr_reader :writes, :file_calls
    attr_accessor :files, :status, :merged_pr, :status_error

    def initialize
      @writes = []
      @file_calls = 0
      @files = []
      @status = false
    end

    def pr_files(_number)
      @file_calls += 1
      raise @files if @files.is_a?(Exception)

      @files
    end

    def set_labels(number, decision)
      @writes << [:labels, number, decision]
    end

    def set_status(sha, description)
      raise status_error if status_error

      @writes << [:status, sha, description]
    end

    def status_ok?(_sha)
      @status
    end

    def merged_pr_for(_sha)
      @merged_pr
    end
  end

  let(:root) { File.expand_path("../../..", __dir__) }
  let(:rules) { CiLabels::Rules.new(root: root) }
  let(:github) { FakeGitHub.new }
  let(:all_false) { { "skip-rspec" => false, "skip-e2e" => false, "skip-deploy" => false } }
  let(:all_true) { { "skip-rspec" => true, "skip-e2e" => true, "skip-deploy" => true } }

  def pull_request(action:, labels: [], head_repo: "acme/app")
    {
      "action" => action,
      "pull_request" => {
        "number" => 9,
        "head" => { "sha" => "head1", "repo" => { "full_name" => head_repo } },
        "base" => { "repo" => { "full_name" => "acme/app" } },
        "labels" => labels.map { |name| { "name" => name } }
      }
    }
  end

  def decide(event_name, event, apply: false)
    described_class.new(event_name: event_name, event: event, github: github, rules: rules, apply: apply).call
  end

  describe "pull_request" do
    it "computes, writes labels and a status on synchronize with apply" do
      github.files = ["CLAUDE.md"]

      expect(decide("pull_request", pull_request(action: "synchronize"), apply: true)).to eq(all_true)
      expect(github.writes).to eq([
        [:labels, 9, all_true],
        [:status, "head1", "skip-rspec, skip-e2e, skip-deploy"]
      ])
    end

    it "writes nothing without apply" do
      github.files = ["CLAUDE.md"]

      expect(decide("pull_request", pull_request(action: "opened"))).to eq(all_true)
      expect(github.writes).to be_empty
    end

    it "describes no labels as none" do
      github.files = ["app/models/user.rb"]

      decide("pull_request", pull_request(action: "opened"), apply: true)

      expect(github.writes.last).to eq([:status, "head1", "none"])
    end

    it "does nothing for a fork" do
      github.files = ["CLAUDE.md"]

      expect(decide("pull_request", pull_request(action: "opened", head_repo: "evil/app"), apply: true)).to eq(all_false)
      expect(github.writes).to be_empty
    end

    it "does nothing when the head repo is gone" do
      event = pull_request(action: "opened")
      event["pull_request"]["head"]["repo"] = nil

      expect(decide("pull_request", event, apply: true)).to eq(all_false)
    end

    it "trusts the event labels on labeled when a status exists" do
      github.status = true

      result = decide("pull_request", pull_request(action: "labeled", labels: ["skip-e2e", "bug"]), apply: true)

      expect(result).to eq("skip-rspec" => false, "skip-e2e" => true, "skip-deploy" => false)
      expect(github.file_calls).to eq(0)
      expect(github.writes).to be_empty
    end

    it "recomputes on labeled when the status is missing" do
      github.files = ["CLAUDE.md"]

      expect(decide("pull_request", pull_request(action: "unlabeled"), apply: true)).to eq(all_true)
      expect(github.writes.map(&:first)).to eq([:labels, :status])
    end

    it "treats a rename out of a code path as a change to the old path" do
      github.files = ["docs/new.md", "app/models/old.rb"]

      expect(decide("pull_request", pull_request(action: "opened"))).to eq(all_false)
    end

    it "falls back to all false for other actions" do
      expect(decide("pull_request", pull_request(action: "closed"))).to eq(all_false)
    end
  end

  describe "push and workflow_run" do
    let(:merged) { { number: 4, head_sha: "pr-head", labels: ["skip-deploy"] } }

    it "uses the merged PR labels when it has a status" do
      github.merged_pr = merged
      github.status = true

      expect(decide("push", { "after" => "m1" })).to eq(all_false.merge("skip-deploy" => true))
    end

    it "is all false without a status" do
      github.merged_pr = merged

      expect(decide("push", { "after" => "m1" })).to eq(all_false)
    end

    it "is all false without a PR" do
      expect(decide("push", { "after" => "m1" })).to eq(all_false)
    end

    it "uses workflow_run.head_sha" do
      seen = nil
      github.define_singleton_method(:merged_pr_for) { |sha| seen = sha; nil }

      decide("workflow_run", { "workflow_run" => { "head_sha" => "wr1" } })

      expect(seen).to eq("wr1")
    end
  end

  it "is all false for workflow_dispatch" do
    expect(decide("workflow_dispatch", {})).to eq(all_false)
  end

  describe "failures" do
    let(:event) { pull_request(action: "opened") }

    it "is all false when pr_files raises" do
      github.files = CiLabels::GitHub::Error.new("boom")

      expect(decide("pull_request", event, apply: true)).to eq(all_false)
    end

    it "is all false for an empty file list" do
      expect(decide("pull_request", event)).to eq(all_false)
    end

    it "is all false for 3000 files" do
      github.files = Array.new(3000) { |i| "docs/#{i}.md" }

      expect(decide("pull_request", event)).to eq(all_false)
    end

    it "still returns the decision when set_status raises" do
      github.files = ["CLAUDE.md"]
      github.status_error = CiLabels::GitHub::Error.new("boom")

      expect(decide("pull_request", event, apply: true)).to eq(all_true)
    end
  end
end
