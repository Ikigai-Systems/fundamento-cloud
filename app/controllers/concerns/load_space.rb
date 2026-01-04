module LoadSpace
  def self.from_param(param_name)
    Module.new do
      extend ActiveSupport::Concern

      define_method(:load_space) do
        @space = current_organization.spaces.find(params[param_name])
      end
    end
  end
end