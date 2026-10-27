require_relative "../../../.github/actions/ci-labels/lib/ci_labels"

RSpec.describe CiLabels::Rules do
  subject(:rules) { described_class.new(root: File.expand_path("../../..", __dir__)) }

  def result(*paths)
    rules.labels_for(paths).values_at(*CiLabels::LABELS)
  end

  {
    ["CLAUDE.md", ".claude/rules/x.md"] => [true, true, true],
    ["README.md"] => [true, true, true],
    ["spec/models/organization_membership_spec.rb"] => [false, true, true],
    ["spec/e2e/cypress/e2e/devices/journeys.cy.js", ".claude/rules/e2e-writing-specs.md"] => [true, false, true],
    ["spec/fixtures/automations.yml"] => [false, false, true],
    [".github/workflows/run-tests.yaml"] => [false, true, true],
    [".github/workflows/lint-and-typecheck.yaml"] => [true, true, true],
    [".github/workflows/package-fundamento-cloud.yaml"] => [true, true, false],
    [".github/workflows/publish-standalone.yaml"] => [true, true, false],
    [".github/actions/ci-labels/rules.yml"] => [false, false, false],
    [".github/actions/setup-sops/action.yaml"] => [false, false, true],
    [".github/actions/docker-build-setup/action.yaml"] => [true, true, false],
    ["app/models/user.rb", "CLAUDE.md"] => [false, false, false],
    ["version.txt", "CHANGELOG.md", ".release-please-manifest.json"] => [false, false, false],
    ["bin/remote-control"] => [false, false, false],
    [".dockerignore"] => [false, false, false],
    [] => [false, false, false]
  }.each do |paths, expected|
    it "labels #{paths.inspect} as #{expected.inspect}" do
      expect(result(*paths)).to eq(expected)
    end
  end

  describe "the ci-labels action's own files" do
    # Run Tests and E2E call the action, so editing it must never skip either suite.
    {
      "action.yaml" => ".github/actions/ci-labels/action.yaml",
      "rules.yml" => ".github/actions/ci-labels/rules.yml",
      "rules.rb" => ".github/actions/ci-labels/lib/ci_labels/rules.rb"
    }.each do |name, path|
      it "does not skip rspec or e2e for a change to #{name}" do
        expect(result(path).first(2)).to eq([false, false])
      end
    end
  end

  describe "#trigger_paths" do
    it "follows local actions referenced from the label's workflows" do
      expect(rules.trigger_paths("skip-deploy")).to include(
        ".github/workflows/package-fundamento-cloud.yaml",
        ".github/workflows/publish-standalone.yaml",
        ".github/actions/docker-build-setup/"
      )
      expect(rules.trigger_paths("skip-rspec")).to include(".github/actions/setup-sops/")
    end
  end
end
