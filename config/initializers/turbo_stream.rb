ActiveSupport.on_load :turbo_streams_tag_builder do
  def redirect_to(target)
    action :redirect_to, target
  end
end