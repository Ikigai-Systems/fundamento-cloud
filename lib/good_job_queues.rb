# How a GoodJob worker splits its threads between queues.
#
# Two kinds of import job decide how much memory a worker needs, so each is served by exactly
# one thread pool and that pool's size is the limit:
#
# - import_documents: every ImportDocumentJob starts a ~240 MB Node converter. Five at once
#   OOM-killed a 1 GB worker over and over.
# - memory_intensive: MemoryIntensiveJob subclasses, which stream attachments (one was a
#   2.34 GB video) or reconvert a whole session. One at a time.
#
# A thread pool is the only per-process limit GoodJob has. A concurrency key cannot be one:
# GoodJob computes the key when a job is enqueued and stores it, so a HOSTNAME key names the
# process that enqueued the job, not the one performing it.
#
# Those pools are not reserved for imports. Each excludes only the *other* import queue, so
# it also runs every ordinary job, and a third pool runs ordinary jobs alone:
#
#   -import_documents:1                     memory_intensive + ordinary jobs
#   -memory_intensive:2                     import_documents + ordinary jobs
#   -import_documents,memory_intensive:2    ordinary jobs only
#
# With no import running, all of GOOD_JOB_MAX_THREADS work on ordinary jobs.
#
# The total stays at GOOD_JOB_MAX_THREADS, which config/initializers/good_job_connection_pool.rb
# sizes the connection pool for. GOOD_JOB_QUEUES, when set, replaces all of this.
module GoodJobQueues
  IMPORT_DOCUMENTS = "import_documents"
  MEMORY_INTENSIVE = "memory_intensive"
  DEFAULT_IMPORT_DOCUMENT_THREADS = 2
  MEMORY_INTENSIVE_THREADS = 1
  DEFAULT_MAX_THREADS = 5 # GoodJob::Configuration::DEFAULT_MAX_THREADS

  def self.queue_string(env)
    return env["GOOD_JOB_QUEUES"] if env["GOOD_JOB_QUEUES"].present?

    max_threads = env.fetch("GOOD_JOB_MAX_THREADS", DEFAULT_MAX_THREADS).to_i
    document_threads = env.fetch("IMPORT_DOCUMENT_THREADS", DEFAULT_IMPORT_DOCUMENT_THREADS).to_i
    document_threads = document_threads.clamp(1, [max_threads - MEMORY_INTENSIVE_THREADS, 1].max)
    ordinary_only_threads = max_threads - document_threads - MEMORY_INTENSIVE_THREADS

    pools = [
      "-#{IMPORT_DOCUMENTS}:#{MEMORY_INTENSIVE_THREADS}",
      "-#{MEMORY_INTENSIVE}:#{document_threads}",
    ]
    # Every pool above already runs ordinary jobs, so this one is extra capacity, not a
    # requirement; leave it out rather than exceed GOOD_JOB_MAX_THREADS.
    pools << "-#{IMPORT_DOCUMENTS},#{MEMORY_INTENSIVE}:#{ordinary_only_threads}" if ordinary_only_threads.positive?
    pools.join(";")
  end
end
