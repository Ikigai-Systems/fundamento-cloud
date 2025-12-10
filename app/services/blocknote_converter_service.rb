module BlocknoteConverterService
  def self.build_env
    env = {}
    sentry_dsn = Rails.application.credentials.dig(:sentry, :blocknote_converter_dsn)
    env["SENTRY_DSN"] = sentry_dsn if sentry_dsn.present?
    env
  end

  def self.yjs_to_blocks(binary_sync)
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

  def self.blocks_to_yjs(blocks)
    # Call the Node.js script and pass the JSON data as an argument
    stdout, stderr, status = Open3.capture3(
      build_env,
      'node ./micro-services/blocknote-converter/build/blocknoteConverter.cjs convert-blocks-to-yjs',
      binmode: true,
      stdin_data: blocks.to_json
    )

    if status.success?
      stdout
    else
      puts stderr  # Handle any errors from Node.js
      raise StandardError.new "Unable to convert document to  YJS"
    end
  end

  def self.blocks_to_markdown(blocknote)
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

  def self.markdown_to_blocks(markdown)
    # Call the Node.js script to convert markdown to BlockNote blocks
    stdout, stderr, status = Open3.capture3(
      build_env,
      'node ./micro-services/blocknote-converter/build/blocknoteConverter.cjs convert-markdown-to-blocks',
      binmode: true,
      stdin_data: markdown
    )

    if status.success?
      JSON.parse(stdout)
    else
      puts stderr
      raise StandardError.new "Unable to convert markdown to blocks"
    end
  end
end