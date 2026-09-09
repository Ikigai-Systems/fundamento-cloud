# The job worker needs a bigger connection pool than the web process: one connection per
# execution thread, plus the LISTEN/NOTIFY listener and the two utility threads GoodJob
# runs for cron and its shared executor. Sized to the thread count alone, the listener
# starves with ConnectionTimeoutError as soon as every thread is busy.
#
# This lives here rather than in config/database.yml because deployed images ship without
# that file — it is gitignored, so Rails configures itself from DATABASE_URL alone, where
# max_connections falls back to 5 and no environment variable reaches it.
#
# Only the `good_job` executable gets the larger pool; exe/good_job sets within_exe before
# it boots Rails, and good_job/cli is never required in the web process.
ActiveSupport.on_load(:active_record) do
  next unless defined?(GoodJob::CLI) && GoodJob::CLI.within_exe?

  # GOOD_JOB_MAX_THREADS is read here rather than GoodJob.configuration.max_threads
  # because --max-threads is merged into the configuration only after Rails has booted.
  max_connections = ENV.fetch("GOOD_JOB_MAX_CONNECTIONS") do
    ENV.fetch("GOOD_JOB_MAX_THREADS", GoodJob::Configuration::DEFAULT_MAX_THREADS).to_i + 1 + 2
  end.to_i

  ActiveRecord::Base.establish_connection(
    ActiveRecord::Base.connection_db_config.configuration_hash.merge(max_connections: max_connections)
  )
end
