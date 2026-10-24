require "json"
require_relative "../../../.github/actions/ci-labels/lib/ci_labels"

RSpec.describe CiLabels::GitHub do
  let(:calls) { [] }
  let(:responses) { {} }
  let(:runner) do
    lambda do |*argv|
      calls << argv
      key = responses.keys.find { |k| argv.join(" ").include?(k) }
      response = responses[key]
      raise response if response.is_a?(Exception)

      response || ""
    end
  end
  subject(:github) { described_class.new(repo: "acme/app", runner: runner) }

  describe "#pr_files" do
    it "returns filenames and previous filenames across pages" do
      pages = [
        [{ "filename" => "docs/new.md", "previous_filename" => "app/models/old.rb" }],
        [{ "filename" => "README.md" }]
      ]
      responses["pulls/7/files"] = JSON.generate(pages)

      expect(github.pr_files(7)).to eq(["docs/new.md", "app/models/old.rb", "README.md"])
    end

    it "accepts a flat array" do
      responses["pulls/7/files"] = JSON.generate([{ "filename" => "a.rb" }])

      expect(github.pr_files(7)).to eq(["a.rb"])
    end
  end

  describe "#merged_pr_for" do
    let(:pulls) do
      [
        { "number" => 1, "merge_commit_sha" => "other", "head" => { "sha" => "h1" }, "labels" => [] },
        { "number" => 2, "merge_commit_sha" => "abc", "head" => { "sha" => "h2" }, "labels" => [{ "name" => "skip-e2e" }] }
      ]
    end

    it "picks the PR whose merge commit matches" do
      responses["commits/abc/pulls"] = JSON.generate(pulls)

      expect(github.merged_pr_for("abc")).to eq(number: 2, head_sha: "h2")
    end

    it "returns nil when none matches" do
      responses["commits/zzz/pulls"] = JSON.generate(pulls)

      expect(github.merged_pr_for("zzz")).to be_nil
    end
  end

  describe "#labels_for" do
    it "returns the current label names of an issue or PR" do
      responses["issues/5/labels"] = JSON.generate([[{ "name" => "skip-e2e" }], [{ "name" => "bug" }]])

      expect(github.labels_for(5)).to eq(["skip-e2e", "bug"])
      expect(calls.first).to include("--paginate", "repos/acme/app/issues/5/labels?per_page=100")
    end
  end

  describe "#status_ok?" do
    it "is false when only other contexts exist" do
      responses["commits/abc/status"] = JSON.generate("statuses" => [{ "context" => "ci/other", "state" => "success" }])

      expect(github.status_ok?("abc")).to be(false)
    end

    it "is false when the ci-labels status is not a success" do
      responses["commits/abc/status"] = JSON.generate("statuses" => [{ "context" => "ci-labels", "state" => "failure" }])

      expect(github.status_ok?("abc")).to be(false)
    end

    it "is true for a successful ci-labels status" do
      responses["commits/abc/status"] = JSON.generate("statuses" => [{ "context" => "ci-labels", "state" => "success" }])

      expect(github.status_ok?("abc")).to be(true)
    end
  end

  describe "#set_labels" do
    it "adds true labels and removes false ones" do
      github.set_labels(5, "skip-rspec" => true, "skip-e2e" => false)

      expect(calls.map { |c| c.join(" ") }).to contain_exactly(
        a_string_including("-X POST", "issues/5/labels", "labels[]=skip-rspec"),
        a_string_including("-X DELETE", "issues/5/labels/skip-e2e")
      )
    end

    it "swallows a 404 on DELETE" do
      responses["-X DELETE"] = CiLabels::GitHub::Error.new("gh: Label does not exist (HTTP 404)")

      expect { github.set_labels(5, "skip-e2e" => false) }.not_to raise_error
    end

    it "raises other errors" do
      responses["-X DELETE"] = CiLabels::GitHub::Error.new("gh: boom (HTTP 500)")

      expect { github.set_labels(5, "skip-e2e" => false) }.to raise_error(CiLabels::GitHub::Error)
    end
  end

  describe "#set_status" do
    it "posts a success status with the ci-labels context" do
      github.set_status("abc", "skip-e2e")

      expect(calls.first.join(" ")).to include("-X POST", "statuses/abc", "state=success", "context=ci-labels", "description=skip-e2e")
    end
  end
end
