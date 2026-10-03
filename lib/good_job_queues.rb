# How a GoodJob worker splits its threads between queues.
#
# ImportDocumentJob shells out to a ~240 MB Node converter per document, so how many run at
# once is what sizes a worker's memory: five of them OOM-killed a 1 GB task over and over.
# A thread pool of their own caps that per process. A concurrency key cannot: GoodJob
# computes the key when a job is enqueued and stores it, so a HOSTNAME key names the process
# that enqueued the job, not the one performing it.
#
# The total stays at GOOD_JOB_MAX_THREADS, which config/initializers/good_job_connection_pool.rb
# sizes the connection pool for. GOOD_JOB_QUEUES, when set, replaces all of this.
module GoodJobQueues
  IMPORT_DOCUMENTS = "import_documents"
  DEFAULT_IMPORT_DOCUMENT_THREADS = 2
  DEFAULT_MAX_THREADS = 5 # GoodJob::Configuration::DEFAULT_MAX_THREADS

  def self.queue_string(env)
    return env["GOOD_JOB_QUEUES"] if env["GOOD_JOB_QUEUES"].present?

    max_threads = env.fetch("GOOD_JOB_MAX_THREADS", DEFAULT_MAX_THREADS).to_i
    document_threads = env.fetch("IMPORT_DOCUMENT_THREADS", DEFAULT_IMPORT_DOCUMENT_THREADS).to_i
    document_threads = document_threads.clamp(1, [max_threads - 1, 1].max)
    other_threads = [max_threads - document_threads, 1].max

    "#{IMPORT_DOCUMENTS}:#{document_threads};-#{IMPORT_DOCUMENTS}:#{other_threads}"
  end
end
