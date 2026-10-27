require_relative "ci_labels/docker_ignore"
require_relative "ci_labels/rules"
require_relative "ci_labels/github"
require_relative "ci_labels/decide"

module CiLabels
  LABELS = ["skip-rspec", "skip-e2e", "skip-deploy"].freeze
end
