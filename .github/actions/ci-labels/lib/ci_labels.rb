require_relative "ci_labels/docker_ignore"
require_relative "ci_labels/rules"

module CiLabels
  LABELS = ["skip-rspec", "skip-e2e", "skip-deploy"].freeze
end
