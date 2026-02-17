module PandocConverterService
  class ConversionError < StandardError;
    def initialize(message, pandoc_error: nil)
      super(message)

      @pandoc_error = pandoc_error
    end

    def to_s
      "#{super} (Pandoc error: #{@pandoc_error})"
    end
  end

  def self.build_env
    env = {}
    sentry_dsn = Rails.application.credentials.dig(:sentry, :pandoc_converter_dsn)
    env["SENTRY_DSN"] = sentry_dsn if sentry_dsn.present?
    env
  end

  def self.file_to_markdown(file_path, format)
    # Call Pandoc CLI directly for file conversion
    # Using --from flag to explicitly specify format (works with files without extensions)
    stdout, stderr, status = Open3.capture3(
      build_env,
      "pandoc",
      "--from", format,
      file_path,
      "--to", "markdown",
      "--wrap=none"
    )

    if status.success?
      stdout
    else
      raise ConversionError.new("Unable to convert document to markdown", pandoc_error: stderr)
    end
  end

  def self.convert_upload(uploaded_file)
    # Validate the file type
    ext = File.extname(uploaded_file.original_filename).downcase

    unless [".docx", ".doc", ".odt"].include?(ext)
      raise ConversionError.new("Unsupported file type: #{ext}")
    end

    # Validate file size (50MB limit)
    max_size = 50.megabytes
    if uploaded_file.size > max_size
      raise ConversionError.new("File exceeds #{max_size / 1.megabyte}MB limit")
    end

    # Map file extension to Pandoc format
    # Remove leading dot: ".docx" → "docx"
    format = ext.delete_prefix(".")

    # Use Rack's tempfile directly - no need to copy!
    # Pandoc will use --from flag to detect format
    markdown = file_to_markdown(uploaded_file.path, format)

    # Extract title from filename
    title = File.basename(uploaded_file.original_filename, ext)

    {
      markdown: markdown,
      title: title,
      metadata: {}
    }
  end
end
