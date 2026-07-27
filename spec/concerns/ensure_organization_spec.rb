require "rails_helper"

RSpec.describe EnsureOrganization do
  # Create a test controller that includes the concern
  let(:test_class) do
    Class.new(ApplicationController) do
      include EnsureOrganization

      # Make the private method accessible for testing
      public :generate_organization_name
    end
  end

  let(:test_instance) { test_class.new }

  describe "#generate_organization_name" do
    it "generates a random organization name" do
      name = test_instance.generate_organization_name

      expect(name).to be_a(String)
      # Format: "Capitalized word Capitalized word"
      expect(name).to match(/\A[A-Z][a-z]+ [A-Z][a-z]+\z/)
    end

    it "generates different names on subsequent calls" do
      names = 5.times.map { test_instance.generate_organization_name }

      # With random sampling, we should get at least some variety
      # (extremely unlikely to get 5 identical names)
      expect(names.uniq.size).to be > 1
    end

    context "when called from multiple threads concurrently" do
      it "does not raise FiberError" do
        threads = []
        errors_queue = Queue.new
        results_queue = Queue.new

        # Simulate concurrent requests in a multi-threaded environment
        10.times do
          threads << Thread.new do
            begin
              # Each thread creates its own instance (simulating different requests)
              instance = test_class.new
              result = instance.generate_organization_name
              results_queue << result
            rescue => e
              errors_queue << e
            end
          end
        end

        threads.each(&:join)

        # Should not have any FiberErrors
        errors_array = errors_queue.size.times.map { errors_queue.pop }
        fiber_errors = errors_array.select { |e| e.is_a?(FiberError) }
        expect(fiber_errors).to be_empty, "Expected no FiberErrors, but got: #{fiber_errors.map(&:message)}"

        # Should have successfully generated names in all threads
        expect(results_queue.size).to eq(10)
        results_array = results_queue.size.times.map { results_queue.pop }
        expect(results_array).to all(be_a(String))
      end
    end
  end
end
