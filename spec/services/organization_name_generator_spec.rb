require "rails_helper"

RSpec.describe OrganizationNameGenerator do
  describe ".generate" do
    it "generates a name of two capitalized words" do
      name = described_class.generate

      expect(name).to be_a(String)
      expect(name).to match(/\A[A-Z][a-z]+ [A-Z][a-z]+\z/)
    end

    it "generates varied names across calls" do
      names = 20.times.map { described_class.generate }

      expect(names.uniq.size).to be > 1
    end

    it "loads non-empty, frozen word lists" do
      expect(described_class::ADJECTIVES).not_to be_empty
      expect(described_class::NOUNS).not_to be_empty
      expect(described_class::ADJECTIVES).to be_frozen
      expect(described_class::NOUNS).to be_frozen
    end

    context "when called from many threads concurrently" do
      it "never raises (thread-safe by construction)" do
        errors = Queue.new
        results = Queue.new

        threads = 50.times.map do
          Thread.new do
            200.times do
              results << described_class.generate
            rescue => e
              errors << e
            end
          end
        end
        threads.each(&:join)

        collected_errors = errors.size.times.map { errors.pop }
        expect(collected_errors).to be_empty,
          "Expected no errors, but got: #{collected_errors.map { |e| "#{e.class}: #{e.message}" }.uniq}"
        expect(results.size).to eq(50 * 200)
      end
    end
  end
end
