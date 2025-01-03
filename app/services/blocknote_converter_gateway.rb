class BlocknoteConverterGateway
  def self.convert_yjs_to_blocks(yjs)
    request_body = {
      yjs: Base64.encode64(yjs),
    }

    request_url = "/convert/yjs/blocks"

    request_conversion(request_url, request_body)
  end

  def self.convert_blocks_to_yjs(blocks)
    request_body = {
      blocks: blocks,
    }

    request_url = "/convert/blocks/yjs"

    request_conversion(request_url, request_body)
  end

  protected

  def self.request_conversion(request_path, request_body)
    request_uri = URI.join(ENV["BLOCKNOTE_CONVERTER_MICROSERVICE_URL"], request_path)

    request_headers = {
      "Content-type" => "application/json",
      "Accept" => "application/json",
    }

    use_http2 = true # for development/debugging only

    if use_http2
      client = NetHttp2::Client.new(request_uri)
      response = client.call(:post, request_uri.path, body: request_body.to_json, headers: request_headers)
      #todo: preserve client open between calls
      client.close
    else
      http = Net::HTTP.new(request_uri.host, request_uri.port)
      response = http.post(request_uri.path, request_body.to_json, request_headers)
    end

    return JSON.parse(response.body)
  rescue Exception => e
    Rails.logger.error e.message
    Rails.logger.error e.backtrace.join("\n")

    return {
      "error" => "Fatal error: unable to evaluate formula"
    }
  end
end