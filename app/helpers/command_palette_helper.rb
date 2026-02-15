module CommandPaletteHelper
  def command_palette(**args)
    ninja_keys_tag = content_tag("ninja-keys", nil, data: {
      controller: "command-palette",
      command_palette_commands_value: palette_commands
    })
    ninja_keys_init_theme_js = javascript_tag <<~EOF
      window.onload = function() {
        document.addEventListener('turbo:load', function() {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.querySelector("ninja-keys").classList.toggle("dark");
          }
        });
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.querySelector("ninja-keys").classList.toggle("dark");
        }
      }
    EOF
    ninja_keys_tag + ninja_keys_init_theme_js
  end
end