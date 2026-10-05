module BlocknoteConverterService
  class ConversionError < StandardError; end

  # A conversion that never came back. Subclasses ConversionError so existing rescues still
  # catch it, while callers that care can tell "this document is bad" from "this document hung".
  class ConversionTimeout < ConversionError; end

  SCRIPT = "./micro-services/blocknote-converter/build/blocknoteConverter.cjs".freeze

  # Generous, because a large docx legitimately takes a while, but finite -- which is the point.
  #
  # There was no timeout here at all, and on 2026-10-05 a single document's conversion never
  # returned: it hung MigrateAttachmentToNpiPk in production for over an hour, mid-transaction,
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

  def self.blocks_to_markdown(blocknote, timeout: TIMEOUT)
    run("convert-blocks-to-markdown", blocknote.to_json, "document to markdown", timeout:)
  end

  def self.markdown_to_blocks(markdown, timeout: TIMEOUT)
    JSON.parse(run("convert-markdown-to-blocks", markdown, "markdown to blocks", timeout:))
  end

  # markdown_to_blocks followed by blocks_to_yjs, in one Node process instead of two. Each
  # process costs ~240 MB and the bundle's startup time, which is most of the work for a
  # typical document, so callers that need both should use this.
  #
  # Returns [blocks, sync].
  def self.markdown_to_blocks_and_yjs(markdown, timeout: TIMEOUT)
    result = JSON.parse(
      run("convert-markdown-to-blocks-and-yjs", markdown, "markdown to blocks and YJS", timeout:)
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
  def self.run(subcommand, stdin_data, description, timeout: TIMEOUT)
    Open3.popen3(build_env, "node", SCRIPT, subcommand) do |stdin, out, err, process|
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

      return reader.value if process.value.success?

      raise ConversionError,
        "Unable to convert #{description}: #{errors.value.to_s.lines.last(5).join.strip}"
    end
  end
  private_class_method :run

  def self.terminate(pid)
    Process.kill("KILL", pid)
  rescue Errno::ESRCH, Errno::EPERM
    # Already gone, or not ours to kill. Either way there is nothing left to stop.
    nil
  end
  private_class_method :terminate
end
