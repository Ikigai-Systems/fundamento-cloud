module BlocknoteConverterService
  def self.build_env
    env = {}
    sentry_dsn = Rails.application.credentials.dig(:sentry, :blocknote_converter_dsn)
    env["SENTRY_DSN"] = sentry_dsn if sentry_dsn.present?
    env
  end

  def self.to_blocks(binary_sync)
    # Call the Node.js script and pass the JSON data as an argument
    stdout, stderr, status = Open3.capture3(
      build_env,
      'node ./micro-services/blocknote-converter/build/blocknoteConverter.cjs convert-yjs-to-blocks',
      binmode: true,
      stdin_data: binary_sync
    )

    if status.success?
      JSON.parse(stdout)
    else
      puts stderr  # Handle any errors from Node.js
      raise StandardError.new "Unable to convert document to blocknote blocks"
    end

  end

  def self.to_markdown(blocknote)
    # Call the Node.js script and pass the JSON data as an argument
    stdout, stderr, status = Open3.capture3(
      build_env,
      'node ./micro-services/blocknote-converter/build/blocknoteConverter.cjs convert-blocks-to-markdown',
      binmode: true,
      stdin_data: blocknote.to_json
    )

    if status.success?
      stdout
    else
      puts stderr  # Handle any errors from Node.js
      raise StandardError.new "Unable to convert document to markdown"
    end

  end
end