module TrackObjectVisit
  def self.action_name(variable_name)
    "create_object_visitor_for_#{variable_name}".to_sym
  end

  def self.for_instance_variable(variable_name)
    Module.new do
      extend ActiveSupport::Concern

      included do
        before_action TrackObjectVisit.action_name(variable_name), if: -> { instance_variable_defined?(variable_name) }
      end

      private

      define_method(TrackObjectVisit.action_name(variable_name)) do
        object = instance_variable_get(variable_name)
        current_user.visit_object(object) if object
      end
    end
  end
end