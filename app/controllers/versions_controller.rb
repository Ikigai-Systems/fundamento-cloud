class VersionsController < ApplicationController
  layout "full_width_application"

  def create
    blocks = JSON.parse(params["blocks"].to_s)

    @document = current_organization.documents.find(params[:document_id])

    ydoc = Y::Doc.new
    update = @document.sync
    update = update.unpack("C*") unless update.nil?
    ydoc.sync(update)

    def traverse_xml_fragment(node)
      if node.is_a? Y::XMLElement
        if node.tag == "blockContainer"
          block = {
            "id" => node.attrs["id"],
            "props" => node.attrs.except("id"),
            "children" => [],
          }
          subblock = traverse_xml_fragment(node.first_child)
          block = block.deep_merge(subblock)
          whitelisted_props = {
            "database" => ["textColor", "textAlignment", "data", "columns"],
            "image" => ["backgroundColor", "caption", "name", "previewWidth", "showPreview", "textAlignment", "url"],
          }[block["type"]]
          if whitelisted_props.present?
            block["props"] = block["props"].slice(*whitelisted_props)
          end

          block
        elsif node.tag == "blockGroup"
          return (0..node.size - 1).map do |i|
            traverse_xml_fragment(node[i])
          end
        else
          content_less_blocks = ["database", "mention", "image"] # blocks and inlineContent with content: "none"
          content = node.size <= 0 && content_less_blocks.include?(node.tag) ? nil : (0..node.size - 1).flat_map do |i|
            traverse_xml_fragment(node[i])
          end
          block = {
            "type" => node.tag,
            "props" => node.attrs,
          }.merge(content.nil? ? {} : {"content" => content})

          convert_to_number_props = {
            "mention" => ["id"],
            "heading" => ["level"],
            "image" => ["previewWidth"],
          }[block["type"]]
          if convert_to_number_props
            convert_to_number_props.each do |prop|
              block["props"][prop] = block["props"][prop].to_i
            end
          end

          convert_to_boolean_props = {
            "image" => ["showPreview"],
          }[block["type"]]
          if convert_to_boolean_props
            convert_to_boolean_props.each do |prop|
              block["props"][prop] = block["props"][prop]&.downcase == "true"
            end
          end

          return block
        end
      elsif node.is_a? Y::XMLText
        blocks = []
        node.diff.each do |diff|
          styles = {}
          diff.attrs&.keys&.excluding("link")&.each { |attr| styles[attr] = true }
          if (diff.attrs&.[]("link")).nil?
            blocks << {
              "type" => "text",
              "text" => diff.insert,
              "styles" => styles
            }
          else
            href = diff.attrs["link"]["href"]
            if (blocks.empty? || blocks.last["href"] != href)
              blocks << {
                "type" => "link",
                "href" => href,
                "content" => [{
                                "type" => "text",
                                "text" => diff.insert,
                                "styles" => styles
                              }]
              }
            else
              blocks.last["content"] << {
                "type" => "text",
                "text" => diff.insert,
                "styles" => styles
              }
            end
          end
        end
        blocks
      elsif node.is_a? Y::XMLFragment
        traverse_xml_fragment(node.first_child)
      else
        [{
           "id" => "initialBlockId",
           "type" => "paragraph",
           "props" => {
             "textColor" => "default",
             "backgroundColor" => "default",
             "textAlignment" => "left"
           },
           "content" => [],
           "children" => [],
         }]
      end
    end

    blocks2 = traverse_xml_fragment(ydoc.get_xml_fragment("document-store"))

    redirect_to edit_space_document_path(params[:space_id], params[:document_id])

    diff = HashDiff.diff(blocks, blocks2)

    if diff.present?
      Sentry.capture_message("XmlfragmentToBlock mismatch for #{params[:space_id]} / #{params[:document_id]} (call stefan) : #{diff}")
    end

    # respond_to do |format|
    #   format.json { render json: current_organization.documents, :except => [:sync] }
    #   format.all { head :unprocessable_content }
    # end
  end

end
