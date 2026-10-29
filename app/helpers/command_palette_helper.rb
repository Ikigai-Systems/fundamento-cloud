module CommandPaletteHelper
  def command_palette(**args)
    # SPIKE: the `palette=cmdk` cookie (server-rendered per request, so it survives Turbo
    # visits) swaps in the cmdk palette. Default stays ninja-keys.
    return cmdk_command_palette if cookies[:palette] == "cmdk"

    # ninja-keys paints itself inside its own shadow root, which the app's
    # dark-mode CSS cannot reach, so the palette has to be told the colour
    # scheme. That is the command-palette controller's job -- see its
    # #syncColorScheme -- rather than an inline script's.
    content_tag("ninja-keys", nil, data: {
      controller: "command-palette",
      action: "command-palette:open@window->command-palette#open",
      command_palette_commands_value: palette_commands
    })
  end

  # SPIKE: one persistent React instance (data-turbo-permanent + stable id) plus a per-page
  # element that hands this page's commands to it.
  def cmdk_command_palette
    safe_join([
      # Same markup react_component renders, but with the persistent loader (see
      # persistent_react_loader_controller.ts), inside a turbo-permanent element.
      content_tag(:div, id: "cmdk-palette-root", data: {
        turbo_permanent: true,
        controller: "persistent-react-loader",
        persistent_react_loader_component_value: "CommandPalette",
        persistent_react_loader_props_auto_converted_to_camel_case_value: {},
        persistent_react_loader_props_no_conversion_value: {}
      }) { "" },
      content_tag(:div, nil, hidden: true, data: {
        controller: "palette-page-commands",
        palette_page_commands_commands_value: palette_commands
      })
    ])
  end
end
