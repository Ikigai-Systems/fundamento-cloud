require "json"
require "open3"
require "cgi"

module CiLabels
  # Thin wrapper over `gh api`.
  #
  # The runner is a callable taking the argv that follows `gh` (always starting with "api") and
  # returning stdout as a String. On a failing call it must raise CiLabels::GitHub::Error whose
  # message carries gh's stderr, so that an "HTTP 404" can be recognised.
  class GitHub
    CONTEXT = "ci-labels".freeze

    class Error < StandardError
      def not_found?
        message.include?("HTTP 404")
      end
    end

    DEFAULT_RUNNER = lambda do |*argv|
      stdout, stderr, status = Open3.capture3("gh", *argv)
      raise Error, "gh #{argv.first(4).join(" ")} failed: #{stderr.strip}" unless status.success?

      stdout
    rescue SystemCallError => e
      raise Error, "gh could not be run: #{e.message}"
    end

    def initialize(repo:, runner: DEFAULT_RUNNER)
      @repo = repo
      @runner = runner
    end

    # Changed paths of a PR, including the old path of every rename.
    def pr_files(number)
      pages = json(@runner.call("api", "--paginate", "--slurp", "repos/#{@repo}/pulls/#{number}/files?per_page=100"))
      Array(pages).flatten.flat_map { |file| [file["filename"], file["previous_filename"]] }.compact
    end

    # Adds the labels set to true and removes those set to false.
    def set_labels(number, decision)
      decision.each do |label, on|
        if on
          @runner.call("api", "-X", "POST", "repos/#{@repo}/issues/#{number}/labels", "-f", "labels[]=#{label}")
        else
          remove_label(number, label)
        end
      end
    end

    def set_status(sha, description)
      @runner.call("api", "-X", "POST", "repos/#{@repo}/statuses/#{sha}",
                   "-f", "state=success", "-f", "context=#{CONTEXT}", "-f", "description=#{description}")
    end

    def status_ok?(sha)
      statuses = json(@runner.call("api", "repos/#{@repo}/commits/#{sha}/status"))["statuses"]
      Array(statuses).any? { |status| status["context"] == CONTEXT && status["state"] == "success" }
    end

    # The PR that produced the given merge commit, or nil.
    def merged_pr_for(sha)
      pulls = json(@runner.call("api", "repos/#{@repo}/commits/#{sha}/pulls"))
      pr = Array(pulls).find { |candidate| candidate["merge_commit_sha"] == sha }
      return unless pr

      { number: pr["number"], head_sha: pr.dig("head", "sha") }
    end

    # Current label names of an issue or PR.
    def labels_for(number)
      pages = json(@runner.call("api", "--paginate", "--slurp", "repos/#{@repo}/issues/#{number}/labels?per_page=100"))
      Array(pages).flatten.map { |label| label["name"] }
    end

    private

    def remove_label(number, label)
      @runner.call("api", "-X", "DELETE", "repos/#{@repo}/issues/#{number}/labels/#{CGI.escape(label)}")
    rescue Error => e
      raise unless e.not_found?
    end

    def json(text)
      JSON.parse(text)
    rescue JSON::ParserError => e
      raise Error, "unparsable response: #{e.message}"
    end
  end
end
