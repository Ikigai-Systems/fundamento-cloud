module CommandPaletteHelper
  def command_palette(**args)
    tag("ninja-keys", data: {
      controller: "command-palette"
    })
  end
end