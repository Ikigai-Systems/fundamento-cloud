module CommandPaletteHelper
  def command_palette(**args)
    tag("ninja-keys", data: {
      controller: "command-palette",
      command_palette_commands_value: palette_commands
    })
  end
end