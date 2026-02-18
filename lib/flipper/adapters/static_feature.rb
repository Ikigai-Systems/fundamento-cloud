# frozen_string_literal: true

# Custom adapter that returns static value for a specific feature
# Uses the decorator pattern to wrap existing adapter and intercept specific features
module Flipper
  module Adapters
    class StaticFeature
      def initialize(adapter, feature_name, enabled)
        @adapter = adapter
        @feature_name = feature_name.to_s
        @enabled = enabled
      end

      def features
        @adapter.features
      end

      def add(feature)
        @adapter.add(feature)
      end

      def remove(feature)
        @adapter.remove(feature)
      end

      def clear(feature)
        @adapter.clear(feature)
      end

      def get(feature)
        if feature.key == @feature_name
          # Return static value without hitting database
          { boolean: @enabled ? "true" : nil }
        else
          @adapter.get(feature)
        end
      end

      def get_multi(features)
        result = {}
        features.each do |feature|
          result[feature.key] = get(feature)
        end
        result
      end

      def get_all
        result = @adapter.get_all
        result[@feature_name] = { boolean: @enabled ? "true" : nil }
        result
      end

      def enable(feature, gate, thing)
        # Ignore attempts to change static feature
        return if feature.key == @feature_name
        @adapter.enable(feature, gate, thing)
      end

      def disable(feature, gate, thing)
        # Ignore attempts to change static feature
        return if feature.key == @feature_name
        @adapter.disable(feature, gate, thing)
      end
    end
  end
end
