module BlocknoteConverterService
  class ConversionError < StandardError; end

  # A conversion that never came back. Subclasses ConversionError so existing rescues still
  # catch it, while callers that care can tell "this document is bad" from "this document hung".
  class ConversionTimeout < ConversionError; end

  SCRIPT = "./micro-services/blocknote-converter/build/blocknoteConverter.cjs".freeze

  # Generous, because a large docx legitimately takes a while, but finite -- which is the point.
  #
  # There was no timeout here at all, and once a single document's conversion never
  # returned: it hung MigrateAttachmentToNpiPk for over an hour, mid-transaction,
  # holding locks. Postgres showed the session `idle in transaction` waiting on ClientRead --
  # the database waiting on a client that was itself waiting on a subprocess. The same hazard
  # applies to every import worker.
  TIMEOUT = 120

  def self.build_env
    env = {}
    sentry_dsn = Rails.application.credentials.dig(:sentry, :blocknote_converter_dsn)
    env["SENTRY_DSN"] = sentry_dsn if sentry_dsn.present?
    env
  end

  def self.yjs_to_blocks(binary_sync, timeout: TIMEOUT)
    JSON.parse(run("convert-yjs-to-blocks", binary_sync, "document to blocknote blocks", timeout:))
  end

  def self.blocks_to_yjs(blocks, timeout: TIMEOUT)
    run("convert-blocks-to-yjs", blocks.to_json, "document to YJS", timeout:)
  end

  # The converter writes UTF-8, but run reads it in binary mode for the Yjs payloads.
  #
  # block_ids writes an Obsidian-style " ^id" marker after the blocks it names, so their ids
  # survive markdown: :all, or a list of ids. Without it the markdown carries no ids.
  def self.blocks_to_markdown(blocknote, block_ids: nil, timeout: TIMEOUT)
    input = block_ids ? {blocks: blocknote, blockIds: block_ids}.to_json : blocknote.to_json

    run("convert-blocks-to-markdown", input, "document to markdown", *json_flag(block_ids), timeout:)
      .force_encoding(Encoding::UTF_8)
  end

  # existing_ids reads " ^id" markers back as block ids: :any honours every marker, for a new
  # document; a list honours only markers naming an id in it, for an update to the document
  # holding those ids. Without it markers are ordinary text.
  def self.markdown_to_blocks(markdown, existing_ids: nil, timeout: TIMEOUT)
    JSON.parse(
      run("convert-markdown-to-blocks", markdown_input(markdown, existing_ids), "markdown to blocks",
        *json_flag(existing_ids), timeout:)
    )
  end

  # markdown_to_blocks followed by blocks_to_yjs, in one Node process instead of two. Each
  # process costs ~240 MB and the bundle's startup time, which is most of the work for a
  # typical document, so callers that need both should use this.
  #
  # Returns [blocks, sync].
  def self.markdown_to_blocks_and_yjs(markdown, existing_ids: nil, timeout: TIMEOUT)
    result = JSON.parse(
      run("convert-markdown-to-blocks-and-yjs", markdown_input(markdown, existing_ids),
        "markdown to blocks and YJS", *json_flag(existing_ids), timeout:)
    )

    [result["blocks"], Base64.strict_decode64(result["yjs"])]
  end

  # One place that knows how to run the converter, so the timeout cannot be added to some
  # callers and forgotten for others.
  #
  # stdout and stderr are drained on their own threads. A child that fills a pipe buffer while
  # the parent waits on the process blocks forever, which is the other way this could hang --
  # and the reason not to simply wrap Open3.capture3 in Timeout.timeout, which would leave the
  # subprocess running and the pipes full.
  def self.run(subcommand, stdin_data, description, *flags, timeout: TIMEOUT)
    Open3.popen3(build_env, "node", SCRIPT, subcommand, *flags) do |stdin, out, err, process|
      # popen3 takes no binmode: option -- that is a capture3 convenience -- and the payloads
      # here are binary both ways, so the streams are switched over by hand.
      [stdin, out, err].each(&:binmode)

      stdin.write(stdin_data)
      stdin.close

      reader = Thread.new { out.read }
      errors = Thread.new { err.read }

      unless process.join(timeout)
        terminate(process.pid)
        [reader, errors].each(&:kill)

        raise ConversionTimeout,
          "Converting #{description} did not finish within #{timeout}s; the converter was killed"
      end

      # Both threads are joined before the block ends, whichever way this goes. popen3 closes
      # the pipes on its way out, and a reader still blocked on a stream it then closes raises
      # IOError -- which Ruby reports with a backtrace per call. Harmless, but it buried the
      # migration's own output under three stack traces per document.
      output = reader.value
      diagnostics = errors.value

      return output if process.value.success?

      raise ConversionError,
        "Unable to convert #{description}: #{diagnostics.to_s.lines.last(5).join.strip}"
    end
  end
  private_class_method :run

  # With an option set, the converter reads a JSON envelope instead of the bare payload.
  def self.markdown_input(markdown, existing_ids)
    return markdown unless existing_ids

    {markdown:, existingIds: existing_ids == :any ? "any" : existing_ids.to_a}.to_json
  end
  private_class_method :markdown_input

  def self.json_flag(option)
    option ? ["--json"] : []
  end
  private_class_method :json_flag

  def self.terminate(pid)
    Process.kill("KILL", pid)
  rescue Errno::ESRCH, Errno::EPERM
    # Already gone, or not ours to kill. Either way there is nothing left to stop.
    nil
  end
  private_class_method :terminate
end
