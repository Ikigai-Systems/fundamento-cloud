# Rails resets CurrentAttributes around every request and job via the executor. Specs run
# outside it, so without this the acting user and Tables::ChangeRecorder's bookkeeping
# leak from one example into the next.
RSpec.configure do |config|
  config.before(:each) { Current.reset }
end
