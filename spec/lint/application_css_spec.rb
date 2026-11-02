require "rails_helper"

# application.css is the Sprockets stylesheet linked after tailwind.css, and manifest.js decides
# what is precompiled into public/assets. A `require_tree .` in the first, or a `link_directory`
# in the second, takes in the raw source of every stylesheet in the directory, including the
# Tailwind ones that the Tailwind build has already compiled. Each rule is then served twice, and
# the copy that comes last wins ties against the compiled one.
RSpec.describe "application.css" do
  let(:bundled) do
    asset = Rails.application.assets.find_asset("application.css")
    asset.metadata[:included].map { |uri| File.basename(uri.sub(%r{\Afile://}, "").split("?").first) }
  end

  it "bundles only the plain CSS files Tailwind has no part in" do
    expect(bundled).to match_array(%w[application.css ia-writer-fonts.css multiselect.css])
  end

  it "publishes only the two stylesheets the layouts link, not the sources behind them" do
    manifest = Rails.application.assets.find_asset("manifest.js")
    linked = manifest.metadata[:links].map { |uri| uri.sub(%r{\Afile://}, "").split("?").first }.select { |path| path.end_with?(".css") }

    expect(linked.map { |path| path.sub("#{Rails.root}/", "") }).to match_array(%w[app/assets/builds/tailwind.css app/assets/stylesheets/application.css])
  end

  it "has no Tailwind source in it" do
    css = Rails.application.assets.find_asset("application.css").to_s

    expect(css).not_to match(/@apply|@tailwind/)
  end

  it "leaves out everything application.tailwind.css imports, which tailwind.css already holds" do
    imported = File.read(Rails.root.join("app/assets/stylesheets/application.tailwind.css")).scan(%r{@import "\./([^"]+)"}).flatten

    expect(imported).not_to be_empty
    expect(bundled & imported).to be_empty
  end
end
