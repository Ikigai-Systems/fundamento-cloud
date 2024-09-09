module BlockNoteConverterNode
  def self.to_blocks(binary_sync)
    data = Base64.encode64(binary_sync)

    # Call the Node.js script and pass the JSON data as an argument
    stdout, stderr, status = Open3.capture3('node ./blocknote/build/blocknote_bundle.js', stdin_data: data)

    if status.success?
      JSON.parse(stdout)
    else
      puts stderr  # Handle any errors from Node.js
      raise StandardError.new "Unable to convert document to blocknote blocks"
    end

  end
end