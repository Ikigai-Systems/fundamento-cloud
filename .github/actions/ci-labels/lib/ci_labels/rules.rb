require "yaml"
require_relative "docker_ignore"

module CiLabels
  # Decides, from a PR's changed paths, which CI steps may be skipped.
  class Rules
    FLAGS = File::FNM_PATHNAME | File::FNM_DOTMATCH | File::FNM_EXTGLOB
    LOCAL_USES = %r{uses:\s*\./(\S+)}

    def initialize(root:)
      @root = root
      @config = YAML.safe_load_file(File.join(root, ".github/actions/ci-labels/rules.yml"))
      dockerignore = File.join(root, ".dockerignore")
      @docker_ignore = DockerIgnore.new(File.exist?(dockerignore) ? File.read(dockerignore) : "")
    end

    def labels_for(paths)
      LABELS.to_h { |label| [label, skippable?(label, paths)] }
    end

    # Workflow files of the label plus every local action or workflow they reference.
    # Directories end with "/".
    def trigger_paths(label)
      found = []
      queue = Array(config("labels", label, "workflows")).map { |name| ".github/workflows/#{name}" }
      until queue.empty?
        file = queue.shift
        next if found.include?(file)

        found << file
        queue.concat(references(file))
      end
      found
    end

    private

    def config(*keys)
      @config.dig(*keys)
    end

    def skippable?(label, paths)
      return false if paths.empty?

      triggers = trigger_paths(label)
      paths.all? { |path| !triggered?(triggers, path) && allowed?(label, path) && !excepted?(label, path) }
    end

    def triggered?(triggers, path)
      triggers.any? { |trigger| trigger.end_with?("/") ? path.start_with?(trigger) : path == trigger }
    end

    def allowed?(label, path)
      spec = config("labels", label)
      (spec["no_check"] && matches?(@config["no_check"], path)) ||
        matches?(spec["skippable"], path) ||
        (spec["dockerignore"] && @docker_ignore.excluded?(path))
    end

    def excepted?(label, path)
      matches?(config("labels", label, "except"), path)
    end

    def matches?(globs, path)
      Array(globs).any? { |glob| File.fnmatch?(glob, path, FLAGS) }
    end

    # Local references found in a file; actions are directories holding action.yaml or action.yml.
    def references(file)
      full = File.join(@root, file)
      return [] unless File.file?(full)

      File.read(full).scan(LOCAL_USES).flatten.flat_map do |ref|
        if File.directory?(File.join(@root, ref))
          action = %w[action.yaml action.yml].map { |name| File.join(ref, name) }.find { |f| File.file?(File.join(@root, f)) }
          ["#{ref.delete_suffix("/")}/", action].compact
        else
          [ref]
        end
      end
    end
  end
end
