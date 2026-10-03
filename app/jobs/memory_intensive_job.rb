# Jobs that can hold a lot of memory -- streaming a large attachment, or reconverting every
# document in a session. They run on the memory_intensive queue, which every worker serves
# from a single thread (lib/good_job_queues.rb), so each worker runs at most one at a time.
#
# This used to be a perform_limit keyed on HOSTNAME. GoodJob computes concurrency keys at
# enqueue time, so that key named the worker that enqueued the job: an import's attachments,
# all enqueued by one orchestrator run, shared a single slot across every worker.
class MemoryIntensiveJob < ApplicationJob
  queue_as GoodJobQueues::MEMORY_INTENSIVE
end
