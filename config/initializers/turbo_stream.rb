ActiveSupport.on_load :turbo_streams_tag_builder do
  def redirect_to(target)
    action :redirect_to, target
  end

  def reload_turbo_frame(target)
    action :reload_turbo_frame, target
  end
end