class FormulaEvalGateway

  def self.evaluate(formula, space = nil, organization_user = nil, additional_context: {}, evaluation_context: {})
    microservice_url = URI(ENV["FORMULA_EVAL_MICROSERVICE_URL"])

    prepare_evaluation_context(space, organization_user, evaluation_context)

    req_body_json = {
      formula: formula,
      additional_context: additional_context,
      evaluation_context: evaluation_context,
    }.to_json

    req_headers = {
      "Content-type" => "application/json",
      "Accept" => "application/json",
      "Authorization" => prepare_jwt_token(space, organization_user)
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

    process_commands(res_json&.[]("commands"), space, organization_user)

    return res_json
  rescue Exception => e
    Rails.logger.error e.message
    Rails.logger.error e.backtrace.join("\n")

    return {
      "error" => error_message(e)
    }
  end

  def self.batch_evaluate(evaluations, space = nil, organization_user = nil)
    microservice_url = URI("#{ENV["FORMULA_EVAL_MICROSERVICE_URL"]}/batch")

    evaluation_context = prepare_evaluation_context(space, organization_user)

    req_body_json = {
      evaluations: evaluations,
      evaluation_context: evaluation_context,
    }.to_json

    req_headers = {
      "Content-type" => "application/json",
      "Accept" => "application/json",
      "Authorization" => prepare_jwt_token(space, organization_user)
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

    res_json&.each do |evaluated_formula|
      process_commands(evaluated_formula&.[]("commands"), space, organization_user)
    end

    return res_json
  rescue Exception => e
    Rails.logger.error e.message
    Rails.logger.error e.backtrace.join("\n")

    return evaluations.map { |e| { "error" => error_message(e) } }
  end

  def self.process_commands(commands, space, organization_user)
    commands&.each do |command|
      case command["type"]
      when "AddRow"
        table = Api::V1::TablesController::find_relevant_table(command["tableNpi"], space.npi, organization_user)
        command["tableNpi"] = table.npi # in case user provided table name, let's transform it to table id and provide it to frontend for caches invalidation
        # todo: validate the user is permitted to update this table

        table.add_row(nil, command["values"])
      when "DeleteRows"
        table = Api::V1::TablesController::find_relevant_table(command["tableNpi"], space.npi, organization_user)
        command["tableNpi"] = table.npi # in case user provided table name, let's transform it to table id and provide it to frontend for caches invalidation
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
        table = Api::V1::TablesController::find_relevant_table(command["tableNpi"], space.npi, organization_user)
        command["tableNpi"] = table.npi # in case user provided table name, let's transform it to table id and provide it to frontend for caches invalidation
        # todo: validate the user is permitted to update this table

        condition_formula = command["conditionFormula"]

        if condition_formula.nil?
          rows_to_update = table.rows
        else
          formulas_to_evaluate = []

          table.rows.each do |row|
            cells = row.cells.index_by(&:column_id)
            current_row_values = table.columns.each_with_object({}) do |column, hash|
              hash[column.name] = cells[column.id]&.value
            end

            additional_context = {
              "currentRow" => current_row_values
            }

            formulas_to_evaluate << {
              formula: condition_formula,
              additional_context: additional_context,
              row_id: row.id,
            }
          end

          row_ids_to_update = []
          FormulaEvalGateway.batch_evaluate(formulas_to_evaluate.map { |e| {formula: e[:formula], additional_context: e[:additional_context]}}, {}).each_with_index do |evaluated_formula, index|
            if evaluated_formula["result"] == true
              row_ids_to_update << formulas_to_evaluate[index].row_id
            end
          end

          rows_to_update = table.rows.filter { |row| row_ids_to_update.include?(row.id) }
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
  end

  private

  def error_message(e)
    "Unable to evaluate formula due to error: #{e.message}"
  end

  def self.prepare_jwt_token(space, organization_user)
    jwt_secret_key = Rails.application.credentials.formula_eval.jwt_secret_key!
    jwt_payload = {
      exp: Time.now.to_i + 60,
      sub: organization_user.to_global_id.to_s,
      aud: space.to_global_id.to_s
    }

    token = JWT.encode(jwt_payload, jwt_secret_key, "HS256")

    "JWT #{token}"
  end

  def self.prepare_evaluation_context(space, organization_user, evaluation_context = {})
    if space
      evaluation_context[:space_npi] = space.npi
    end

    if organization_user
      evaluation_context[:user_id] = organization_user.user.id
    end

    evaluation_context
  end

end