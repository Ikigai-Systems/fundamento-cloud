require "rails_helper"

RSpec.describe GoodJobQueues do
  describe ".queue_string" do
    it "splits the default 5 threads: 2 import documents, 1 memory-intensive, 2 for the rest" do
      expect(described_class.queue_string({}))
        .to eq("-import_documents:1;-memory_intensive:2;-import_documents,memory_intensive:2")
    end

    it "keeps the total at GOOD_JOB_MAX_THREADS" do
      expect(described_class.queue_string("GOOD_JOB_MAX_THREADS" => "8"))
        .to eq("-import_documents:1;-memory_intensive:2;-import_documents,memory_intensive:5")
    end

    it "takes the import document share from IMPORT_DOCUMENT_THREADS" do
      expect(described_class.queue_string("IMPORT_DOCUMENT_THREADS" => "1"))
        .to eq("-import_documents:1;-memory_intensive:1;-import_documents,memory_intensive:3")
    end

    it "drops the ordinary-only pool rather than exceed GOOD_JOB_MAX_THREADS" do
      expect(described_class.queue_string("GOOD_JOB_MAX_THREADS" => "2", "IMPORT_DOCUMENT_THREADS" => "4"))
        .to eq("-import_documents:1;-memory_intensive:1")
    end

    it "serves each import queue from exactly one pool, and ordinary queues from every pool" do
      pools = described_class.queue_string({}).split(";").map do |pool|
        queues, threads = pool.split(":")
        [GoodJob::Job.queue_parser(queues), threads.to_i]
      end
      serves = ->(parsed, queue) { parsed[:all] || (parsed[:exclude] ? !parsed[:exclude].include?(queue) : parsed[:include].include?(queue)) }
      threads_for = ->(queue) { pools.select { |parsed, _| serves.(parsed, queue) }.sum { |_, threads| threads } }

      expect(threads_for.(GoodJobQueues::IMPORT_DOCUMENTS)).to eq(2)
      expect(threads_for.(GoodJobQueues::MEMORY_INTENSIVE)).to eq(1)
      expect(threads_for.("maintenance")).to eq(5)
      expect(threads_for.("default")).to eq(5)
    end

    it "defers to GOOD_JOB_QUEUES when an operator sets it" do
      expect(described_class.queue_string("GOOD_JOB_QUEUES" => "*")).to eq("*")
    end
  end

  it "is what the application configures" do
    expect(Rails.application.config.good_job.queues).to eq(described_class.queue_string(ENV))
  end

  it "routes ImportDocumentJob to its own queue" do
    expect(ImportDocumentJob.new.queue_name).to eq(GoodJobQueues::IMPORT_DOCUMENTS)
  end

  it "routes every memory-intensive job to the single-threaded queue" do
    expect(ImportAttachmentJob.new.queue_name).to eq(GoodJobQueues::MEMORY_INTENSIVE)
    expect(ImportLinkResolutionJob.new.queue_name).to eq(GoodJobQueues::MEMORY_INTENSIVE)
  end
end
