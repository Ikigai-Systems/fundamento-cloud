require_relative "../../../.github/actions/ci-labels/lib/ci_labels"

RSpec.describe CiLabels::DockerIgnore do
  subject(:ignore) { described_class.new(File.read(File.expand_path("../../../.dockerignore", __dir__))) }

  [
    "CLAUDE.md",
    ".claude/rules/x.md",
    "docs/a.md",
    ".github/workflows/run-tests.yaml",
    "spec/models/x_spec.rb",
    "micro-services/blocknote-converter/node_modules/a.js",
    "config/secrets/production.sops.yaml",
    ".env.development.local",
    "public/vite/assets/application.js"
  ].each do |path|
    it "excludes #{path}" do
      expect(ignore.excluded?(path)).to be(true)
    end
  end

  [
    "spec/e2e/cypress/e2e/a.cy.js",
    "spec/fixtures/users.yml",
    "app/models/user.rb",
    "README.md",
    ".dockerignore",
    "version.txt",
    "app/CLAUDE.md",
    ".env.production.erb",
    "public/404.html",
    "public/500.html",
    "public/robots.txt"
  ].each do |path|
    it "keeps #{path}" do
      expect(ignore.excluded?(path)).to be(false)
    end
  end
end
