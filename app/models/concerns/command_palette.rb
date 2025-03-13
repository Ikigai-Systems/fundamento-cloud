module CommandPalette
  extend ActiveSupport::Concern

  included do
    helper_method :add_palette_command, :palette_commands
  end

  protected

  def add_palette_command(id:, title:, section:, icon:, hotkey:, handler:)
    @pallete_commands ||= []
    @pallete_commands << {id: id, title: title, section: section, icon: icon, hotkey: hotkey, handler: handler}
  end

  def palette_commands
    @pallete_commands ||= []
  end
end