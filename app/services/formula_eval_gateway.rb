class FormulaEvalGateway
  #todo: deprecate and remove
  def self.evaluate_old_way(formula, additional_context)
    mini_racer_context = MiniRacer::Context.new
    bundled_js = File.read(Rails.root.join("formula/build/formula.js"))

    mini_racer_context.eval("var exports = {};")
    mini_racer_context.eval(bundled_js)
    mini_racer_context.eval("var formula = #{(formula || {}).to_json};")
    mini_racer_context.eval("var context = #{additional_context.to_json}")
    mini_racer_context.eval("exports.evaluateFormula(formula, context)")
  end

  def self.evaluate(formula, additional_context = {})
    microservice_url = URI(ENV["FORMULA_EVAL_MICROSERVICE_URL"])

    client = NetHttp2::Client.new(URI.join(microservice_url, "/"))

    res = client.call(:post, microservice_url.path, headers: {
      "Content-type" => "application/json",
      "Accept" => "application/json",
    }, body: {
      formula: formula,
      additional_context: additional_context,
    }.to_json)

    #todo: preserve client open between calls
    client.close

    formula_result = JSON.parse(res.body)

    formula_result&.[]("commands")&.each do |command|
      case command["type"]
      when "AddRow"
        table = Table.find(command["tableId"])
        # todo: validate the user is permitted to update this table

        # todo: adding row logic should go to table.rb model probably
        last_row = table.rows_in_order.last
        new_row = table.rows.create!(
          previous_row: last_row,
          organization_id: table.organization_id,
        )
        table.columns.each do |column|
          new_row.cells.create!(
            table: table,
            column: column,
            # value: value, # todo: update this when AddRow formula allows creating rows with prefilled column values
            organization_id: table.organization_id,
            )
        end
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
      else
        puts "Failed to parse formula `#{formula}` results: unrecognized command `#{command}`"
      end
    end

    return formula_result

    # non HTTP/2 way:
    # res = Net::HTTP.post_form(
    #   URI(ENV["FORMULA_EVAL_MICROSERVICE_URL"]),
    #   formula: formula,
    #   additional_context: additional_context.to_json,
    # )

  rescue Exception => e
    Rails.logger.error e.message
    Rails.logger.error e.backtrace.join("\n")

    return {
      "error" => "Fatal error: unable to evaluate formula"
    }
  end

end