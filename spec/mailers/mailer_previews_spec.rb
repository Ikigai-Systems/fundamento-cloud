require "rails_helper"

# Every preview doubles as a render test: a template that raises, loses its logo or
# ships without a plain-text part fails here instead of in production.
RSpec.describe "Mailer previews", type: :mailer do
  fixtures :organizations, :users, :organization_memberships, :public_links, :documents, :spaces

  previews = ActionMailer::Preview.all.flat_map do |preview|
    preview.emails.map { |email| [preview.preview_name, email] }
  end

  it "covers every Devise mail we ship" do
    expect(DeviseMailerPreview.emails).to match_array(
      %w[invitation_instructions confirmation_instructions reset_password_instructions
         magic_link password_change email_changed]
    )
  end

  previews.each do |preview_name, email|
    describe "#{preview_name}/#{email}" do
      let(:mail) do
        ActionMailer::Base.deliveries.clear
        ActionMailer::Preview.all.find { |p| p.preview_name == preview_name }.call(email)
      end
      let(:html) { mail.html_part.body.decoded }

      it "renders html and plain text with a logo, without leftover template code" do
        expect(mail.html_part).to be_present
        expect(mail.text_part).to be_present
        expect(mail.text_part.body.decoded.strip).not_to be_empty
        expect(html).to match(/<img[^>]*src="(cid:|data:image)/)
        expect(html).not_to include("<%")
      end

      it "inlines styles and keeps images accessible" do
        expect(html).to match(/<h1[^>]*style=/)
        Nokogiri::HTML(html).css("img").each { |img| expect(img["alt"]).to be_present }
      end

      it "only links to absolute https or http urls" do
        hrefs = Nokogiri::HTML(html).css("a[href]").map { |a| a["href"] }
        expect(hrefs).to all(match(%r{\Ahttps?://}))
      end
    end
  end
end
