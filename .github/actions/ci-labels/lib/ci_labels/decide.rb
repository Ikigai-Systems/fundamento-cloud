require_relative "github"

module CiLabels
  # Turns a GitHub event into the skip decision. Any problem yields "skip nothing".
  class Decide
    MAX_FILES = 3000
    PR_ACTIONS = %w[opened synchronize reopened].freeze
    LABEL_ACTIONS = %w[labeled unlabeled].freeze

    def initialize(event_name:, event:, github:, rules:, apply:)
      @event_name = event_name
      @event = event
      @github = github
      @rules = rules
      @apply = apply
    end

    def call
      decision = case @event_name
                 when "pull_request" then pull_request
                 when "push" then merged(@event["after"])
                 when "workflow_run" then merged(@event.dig("workflow_run", "head_sha"))
                 end
      decision || none
    rescue GitHub::Error => e
      warn "ci-labels: #{e.message}"
      none
    end

    private

    def none
      LABELS.to_h { |label| [label, false] }
    end

    def pull_request
      pr = @event["pull_request"]
      return if fork?(pr)

      action = @event["action"]
      if LABEL_ACTIONS.include?(action) && @github.status_ok?(pr.dig("head", "sha"))
        current_labels(pr["number"])
      elsif PR_ACTIONS.include?(action) || LABEL_ACTIONS.include?(action)
        compute(pr)
      end
    end

    def fork?(pr)
      head = pr.dig("head", "repo", "full_name")
      head.nil? || head != pr.dig("base", "repo", "full_name")
    end

    def compute(pr)
      files = @github.pr_files(pr["number"])
      return if files.empty? || files.size >= MAX_FILES

      decision = @rules.labels_for(files)
      apply(pr, decision) if @apply
      decision
    end

    def apply(pr, decision)
      @github.set_labels(pr["number"], decision)
      begin
        on = decision.select { |_, value| value }.keys
        @github.set_status(pr.dig("head", "sha"), on.empty? ? "none" : on.join(", "))
      rescue GitHub::Error => e
        warn "ci-labels: status not set: #{e.message}"
      end
    end

    def merged(sha)
      return unless sha

      pr = @github.merged_pr_for(sha)
      return unless pr && @github.status_ok?(pr[:head_sha])

      current_labels(pr[:number])
    end

    # Read after the status check, never from an event payload or an earlier response: the
    # labeler writes labels before the status, so labels read later are at least that fresh.
    def current_labels(number)
      names = @github.labels_for(number)
      LABELS.to_h { |label| [label, names.include?(label)] }
    end
  end
end
