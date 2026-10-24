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
    [".github/actions/setup-sops/action.yaml"] => [false, false, false],
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

  describe "#trigger_paths" do
    it "follows local actions referenced from the label's workflows" do
      expect(rules.trigger_paths("skip-deploy")).to include(
        ".github/workflows/package-fundamento-cloud.yaml",
        ".github/actions/setup-sops/",
        ".github/actions/docker-build-setup/"
      )
    end
  end
end
