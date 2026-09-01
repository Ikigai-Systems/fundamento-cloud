module CommandPaletteHelper
  def command_palette(**args)
    # ninja-keys paints itself inside its own shadow root, which the app's
    # dark-mode CSS cannot reach, so the palette has to be told the colour
    # scheme. That is the command-palette controller's job -- see its
    # #syncColorScheme -- rather than an inline script's.
    content_tag("ninja-keys", nil, data: {
      controller: "command-palette",
      command_palette_commands_value: palette_commands
    })
  end
end
