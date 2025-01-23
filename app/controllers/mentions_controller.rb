class MentionsController < ApplicationController
  after_action :verify_authorized, except: [:index]

  def index
    @documents = policy_scope(current_organization.documents)
                   .map { |d| d.versions.latest }.filter { |v| v.present? }
                   .filter do |version|
      found = false
      version.content.each do |block|
        if find_mention_in(block)
          found = true
          break
        end
      end
      found
    end.map { |v| v.document }

    respond_to do |format|
      format.html { render partial: "mentions_tab" }
      # format.json { render json: pundit_user.organization_user.favorites }
    end
  end

  private

  def find_mention_in(block)
    if (block.dig("type") == "mention") && block.dig("props", "entity") == "user" && block.dig("props", "id") == current_user.id
      return true
    end
    block.each do |key, value|
      if key.is_a? Hash
        if find_mention_in(key)
          return true
        end
      end

      if value.is_a? Hash
        if find_mention_in(value)
          return true
        end
      elsif value.is_a? Array
        if value.any? { |elem| find_mention_in(elem) }
          return true
        end
      end
    end

    false
  end

end