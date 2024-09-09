module BlockNoteConverterRuby
  def self.to_blocks(binary_sync)
    ydoc = Y::Doc.new
    ydoc.sync(binary_sync.unpack("C*")) unless binary_sync.nil?
    traverse_xml_fragment(ydoc.get_xml_fragment("document-store"))
  end

  private

  def self.traverse_xml_fragment(node)
    if node.is_a? Y::XMLElement
      if node.tag == "blockContainer"
        block = {
          "id" => node.attrs["id"],
          "props" => node.attrs.except("id"),
          "children" => node.size > 1 ? traverse_xml_fragment(node[1]) : [],
        }
        subblock = traverse_xml_fragment(node.first_child)
        block = block.deep_merge(subblock)
        whitelisted_props = {
          "database" => ["textColor", "textAlignment", "data", "columns"],
          "image" => ["backgroundColor", "caption", "name", "previewWidth", "showPreview", "textAlignment", "url"],
          "numberedListItem" => ["backgroundColor", "textAlignment", "textColor"],
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
        content = nil
        unless content_less_blocks.include?(node.tag)
          subnodes = (0..node.size - 1).flat_map do |i|
            traverse_xml_fragment(node[i])
          end

          content = []
          index = 0
          while index < subnodes.length
            subnode = subnodes[index]

            if subnode["type"] == "hardBreak"
              if content.last # remove after upgrading to y-rb 0.5.7
                if content.last["text"]
                  content.last["text"] += "\n"
                else
                  content.last["content"].last["text"] += "\n"
                end
              end
              if content.last # remove after upgrading to y-rb 0.5.7
                if (subnodes[index+1]["styles"] == subnodes[index-1]["styles"]) && (subnodes[index+1]["type"] == subnodes[index-1]["type"])
                  content.last["text"] += subnodes[index+1]["text"]
                  index = index + 1
                end
              end
            else
              content << subnode
            end
            index = index + 1
          end
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
          "checkListItem" => ["checked"]
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
      if node.respond_to? :diff # remove when upstream y-rb releases 0.5.7
        node.diff.each do |diff|
          styles = {}
          diff.attrs&.keys&.excluding("link")&.each { |attr| styles[attr] = diff.attrs[attr]["stringValue"] ? diff.attrs[attr]["stringValue"] : true }
          if (diff.attrs&.[]("link")).nil?
            blocks << {
              "type" => "text",
              "text" => diff.insert,
              "styles" => styles
            }
          else
            href = diff.attrs["link"]["href"]
            if blocks.empty? || blocks.last["href"] != href
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

end