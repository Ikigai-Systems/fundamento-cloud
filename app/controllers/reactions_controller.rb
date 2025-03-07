class ReactionsController < Objects::ReactionsController

  protected

  def load_resource
    if params[:object_gid]
      @resource = GlobalID::Locator.locate(params[:object_gid], only: ObjectReaction::ALLOWED_OBJECT_TYPES.map(&:constantize))

      if @resource.nil? || @resource.organization != current_organization
        return head :unprocessable_entity
      end
    else
      unless ObjectReaction::ALLOWED_OBJECT_TYPES.include?(params[:object_type])
        return head :unprocessable_entity
      end

      @resource = params[:object_type].constantize.
        find_by_param!(params[:object_id])
    end
  end

  def resource_reactions_path(resource)
    reactions_path(object_type: resource.class.to_s, object_id: resource.to_param)
  end

  def resource_reaction_path(resource, reaction)
    reaction_path(reaction, object_type: resource.class.to_s, object_id: resource.to_param)
  end

  def resource
    @resource
  end
end