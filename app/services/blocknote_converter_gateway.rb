class BlocknoteConverterGateway
  def self.convert(blocknote)
    microservice_url = URI(ENV["BLOCKNOTE_CONVERTER_MICROSERVICE_URL"])

    req_body_json = {
      blocks: blocknote,
    }.to_json
    req_headers = {
      "Content-type" => "application/json",
      "Accept" => "application/json",
    }

    use_http2 = true # for development/debugging only

    if use_http2
      client = NetHttp2::Client.new(URI.join(microservice_url, "/"))
      res = client.call(:post, microservice_url.path, body: req_body_json, headers: req_headers)
      #todo: preserve client open between calls
      client.close
    else
      http = Net::HTTP.new(microservice_url.host, microservice_url.port)
      res = http.post(microservice_url.path, req_body_json, req_headers)
    end

    res_json = JSON.parse(res.body)

    return res_json
  rescue Exception => e
    Rails.logger.error e.message
    Rails.logger.error e.backtrace.join("\n")

    return {
      "error" => "Fatal error: unable to evaluate formula"
    }
  end
end