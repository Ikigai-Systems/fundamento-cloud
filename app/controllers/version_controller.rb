# Reports the running application version. Self-hosted operators use this to confirm
# which release a deployment is on; the value comes from version.txt, which
# release-please owns.
class VersionController < ActionController::Base
  def show
    render json: { version: Fundamento::VERSION }
  end
end
