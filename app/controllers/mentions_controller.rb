class MentionsController < ApplicationController
  after_action :verify_authorized, except: [:index]

  def index
    @mentions = []
    policy_scope(current_organization.documents).each do |document|
      document.versions.each do |version|
        version.content.each do |block|
          each_mention(block) do |mention|
            if mention.dig("props", "entity") == "user" && mention.dig("props", "entityId") == current_user.id
              @mentions.push(mention.merge({ version: version }))
            end
          end
        end
      end
    end

    respond_to do |format|
      format.html { render partial: "mentions_tab" }
    end
  end

  private

  def each_mention(node, &block)
    return unless node.is_a? Hash

    if node.dig("type") == "mention"
      yield node
    end
    node.each do |key, value|
      if key.is_a? Hash
        each_mention(key, &block)
      end

      if value.is_a? Hash
        each_mention(value, &block)
      elsif value.is_a? Array
        value.each { |elem| each_mention(elem, &block) }
      end
    end
  end
end