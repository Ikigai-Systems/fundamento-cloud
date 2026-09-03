# Rails resets CurrentAttributes around every request and job via the executor. Specs run
# outside it, so without this the acting user, the organization, and
# Tables::ChangeRecorder's bookkeeping leak from one example into the next.
#
# Resetting every descendant rather than naming them keeps this correct as more are added.
RSpec.configure do |config|
  config.before(:each) { ActiveSupport::CurrentAttributes.descendants.each(&:reset) }
end
