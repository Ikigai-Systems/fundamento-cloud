flipper_flags = command_options.try(:[], 'flags') rescue []

Flipper.features.each(&:remove) rescue nil
flipper_flags.each { |flag| Flipper.enable(flag) }

logger.debug "Flipper flags enabled: #{flipper_flags}"
