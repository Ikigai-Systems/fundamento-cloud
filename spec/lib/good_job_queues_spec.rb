require "rails_helper"

RSpec.describe GoodJobQueues do
  describe ".queue_string" do
    it "gives import documents 2 of the default 5 threads and the rest to every other queue" do
      expect(described_class.queue_string({})).to eq("import_documents:2;-import_documents:3")
    end

    it "keeps the total at GOOD_JOB_MAX_THREADS" do
      expect(described_class.queue_string("GOOD_JOB_MAX_THREADS" => "8")).to eq("import_documents:2;-import_documents:6")
    end

    it "takes the import document share from IMPORT_DOCUMENT_THREADS" do
      expect(described_class.queue_string("IMPORT_DOCUMENT_THREADS" => "1")).to eq("import_documents:1;-import_documents:4")
    end

    it "always leaves at least one thread for the other queues" do
      expect(described_class.queue_string("GOOD_JOB_MAX_THREADS" => "2", "IMPORT_DOCUMENT_THREADS" => "4"))
        .to eq("import_documents:1;-import_documents:1")
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
end
