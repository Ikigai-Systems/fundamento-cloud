#!/usr/bin/env ruby
# Usage: ruby .github/actions/ci-labels/ci_labels.rb decide [--apply]
# Run from the repository root. Never exits non-zero: on any problem nothing is skipped.
require "json"
require_relative "lib/ci_labels"

def write_outputs(decision)
  path = ENV["GITHUB_OUTPUT"]
  return unless path

  File.open(path, "a") do |file|
    CiLabels::LABELS.each { |label| file.puts("#{label.tr("-", "_")}=#{decision[label]}") }
  end
end

decision = CiLabels::LABELS.to_h { |label| [label, false] }
begin
  if ARGV.first == "decide"
    event_path = ENV["GITHUB_EVENT_PATH"]
    event = event_path && File.file?(event_path) ? JSON.parse(File.read(event_path)) : {}
    decision = CiLabels::Decide.new(
      event_name: ENV["GITHUB_EVENT_NAME"].to_s,
      event: event,
      github: CiLabels::GitHub.new(repo: ENV["GITHUB_REPOSITORY"].to_s),
      rules: CiLabels::Rules.new(root: Dir.pwd),
      apply: ARGV.include?("--apply")
    ).call
  else
    warn "ci-labels: unknown command #{ARGV.first.inspect}"
  end
rescue StandardError => e
  warn "ci-labels: #{e.class}: #{e.message}"
  decision = CiLabels::LABELS.to_h { |label| [label, false] }
end

write_outputs(decision)
on = decision.select { |_, value| value }.keys
puts "ci-labels: #{on.empty? ? "none (run everything)" : on.join(", ")}"
exit 0
