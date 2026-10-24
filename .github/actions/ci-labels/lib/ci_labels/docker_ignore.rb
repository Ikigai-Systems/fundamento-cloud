module CiLabels
  # Docker's .dockerignore semantics (not gitignore's): a pattern covers a path when it matches
  # the path or any parent directory, and the last matching pattern wins.
  class DockerIgnore
    FLAGS = File::FNM_PATHNAME | File::FNM_DOTMATCH | File::FNM_EXTGLOB

    def initialize(text)
      @patterns = text.each_line.filter_map do |line|
        line = line.strip
        next if line.empty? || line.start_with?("#")

        negated = line.start_with?("!")
        line = line.delete_prefix("!")
        [line.delete_prefix("/").delete_suffix("/"), negated]
      end
    end

    def excluded?(path)
      parts = path.split("/")
      candidates = (1..parts.size).map { |n| parts.first(n).join("/") }
      excluded = false
      @patterns.each do |pattern, negated|
        excluded = !negated if candidates.any? { |candidate| File.fnmatch?(pattern, candidate, FLAGS) }
      end
      excluded
    end
  end
end
