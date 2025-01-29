class MentionsController < ApplicationController
  after_action :verify_authorized, except: [:index]

  def index
    all_mentions = []
    policy_scope(current_organization.documents).includes(:versions).each do |document|
      document.versions.each do |version|
        version.content.each do |block|
          each_mention(block) do |mention|
            if mention.dig("props", "entity") == "user" && mention.dig("props", "entityId") == current_user.id
              all_mentions.push(mention.merge({ version: version }))
            end
          end
        end
      end
    end

    @mentions = all_mentions.group_by { |mention| mention["props"]["id"] }.each do |mention_id, mentions|
      mentions.sort_by do |elem|
        elem[:version].created_at
      end
    end.map do |mention_id, mentions|
      mentions.first.merge({ most_recent_version: mentions.last[:version] })
    end.sort_by { |mention| mention[:version].created_at }.reverse

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