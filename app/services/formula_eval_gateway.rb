class FormulaEvalGateway

  def self.evaluate(formula, additional_context = {})
    microservice_url = URI(ENV["FORMULA_EVAL_MICROSERVICE_URL"])

    req_body_json = {
      formula: formula,
      additional_context: additional_context,
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

    res_json&.[]("commands")&.each do |command|
      case command["type"]
      when "AddRow"
        table = Table.find(command["tableId"])
        # todo: validate the user is permitted to update this table

        table.add_row
      when "DeleteRows"
        table = Table.find(command["tableId"])
        # todo: validate the user is permitted to update this table

        # todo: extract row ids from command payload, iterate over them. Otherwise, just remove all rows

        # todo: removing rows logic should go to table.rb model probably
        loop do
          row = table.rows.first
          break if row.nil?
          next_row = row.next_row
          next_row.update(previous_row: row.previous_row) unless next_row.nil?
          row.destroy
        end
      when "AddOrUpdateRows"
        table = Table.find(command["tableId"])
        # todo: validate the user is permitted to update this table

        condition_formula = command["conditionFormula"]

        rows_to_update = table.rows.filter do |row|
          if condition_formula.nil?
            true
          else
            cells = row.cells.index_by(&:column_id)
            current_row_values = table.columns.each_with_object({}) do |column, hash|
              hash[column.name] = cells[column.id]&.value
            end

            additional_context = {
              "currentRow" => current_row_values
            }

            formula_evaluation = FormulaEvalGateway.evaluate(condition_formula, additional_context)

            formula_evaluation["result"] == true
          end
        end

        column_name = command["columnName"]
        column_value = command["columnValue"]

        if rows_to_update.empty?
          table.add_row(nil, {
            column_name => column_value
          })
        else
          unless column_name.nil? || column_value.nil?
            rows_to_update.each do |row|
              # todo: update row logic should go to table.rb model probably
              column_id = table.columns.find_by(name: column_name).id
              row.cells.find_by(column_id: column_id).update(value: column_value)
            end
          end
        end
      else
        puts "Failed to parse formula `#{formula}` results: unrecognized command `#{command}`"
      end
    end

    return res_json
  rescue Exception => e
    Rails.logger.error e.message
    Rails.logger.error e.backtrace.join("\n")

    return {
      "error" => "Fatal error: unable to evaluate formula"
    }
  end

  def self.batch_evaluate(evaluations)
    microservice_url = URI("#{ENV["FORMULA_EVAL_MICROSERVICE_URL"]}/batch")

    req_body_json = {
      evaluations: evaluations,
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
  end

end