module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user
    identified_by :current_organization

    def connect
      self.current_user = load_current_user
      self.current_organization = load_current_organization
    end

    def around_command
      # This method can be used to set thread local context for the time given command is processed
      # with_tenant(self.organization) { yield }
    end

    private

    def load_current_user
      if (current_user = env['warden'].user)
        current_user
      else
        reject_unauthorized_connection
      end
    end

    def load_current_organization
      if (current_organization = Organization.find_by_id(cookies.encrypted[:organization_id])) \
        && current_user.organizations.include?(current_organization)
        current_organization
      else
        reject_unauthorized_connection
      end
    end
  end
end
