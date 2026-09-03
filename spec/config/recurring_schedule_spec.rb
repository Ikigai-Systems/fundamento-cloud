require "rails_helper"
require "fugit"

# config/recurring.yml sat in the repo for months doing nothing: GoodJob has no such
# convention, so unless application.rb loads it explicitly the file is inert and every
# job listed in it silently never runs. These specs assert the wiring and the contents,
# because the failure mode is silence rather than an error.
RSpec.describe "the recurring job schedule" do
  let(:schedule) { YAML.load_file(Rails.root.join("config/recurring.yml")) }
  let(:cron) { Rails.application.config.good_job.cron }

  it "is loaded into GoodJob's cron configuration" do
    expect(cron.keys).to match_array(schedule.keys.map(&:to_sym))
  end

  it "carries each entry's schedule and class through" do
    schedule.each do |name, entry|
      expect(cron.fetch(name.to_sym)).to include(cron: entry["cron"], class: entry["class"])
    end
  end

  # A typo here would deploy cleanly and then fail at 3am inside a worker.
  it "names job classes that exist and are jobs" do
    schedule.each_value do |entry|
      klass = entry.fetch("class").safe_constantize
      expect(klass).to be_present, "#{entry["class"]} does not exist"
      expect(klass.ancestors).to include(ActiveJob::Base)
    end
  end

  it "gives every entry a cron expression GoodJob can parse" do
    schedule.each do |name, entry|
      expect(Fugit::Cron.parse(entry.fetch("cron"))).to be_present, "#{name} has an unparseable cron"
    end
  end

  it "describes every entry, so the GoodJob dashboard is readable" do
    schedule.each { |name, entry| expect(entry["description"]).to be_present, "#{name} has no description" }
  end

  it "stays switched off outside the environments that run a worker" do
    expect(Rails.application.config.good_job.enable_cron).to be_falsey
  end
end
