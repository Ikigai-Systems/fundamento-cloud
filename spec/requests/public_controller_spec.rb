require "rails_helper"

RSpec.describe PublicController, type: :request do
  fixtures :organizations, :spaces, :users, :organization_users, :documents, :versions, :public_links

  let(:pawel) { users(:pawel) }
  let(:document) { documents(:two) }
  let(:public_link) { public_links(:public_link_to_two) }
  let(:public_url) { "/public/#{public_link.id}" }

  describe "GET #show" do
    context "when user is not authenticated" do
      it "redirects to sign in page" do
        get public_url

        expect(response).to redirect_to(new_user_session_path)
      end

      it "stores the public link location for redirect after sign in" do
        get public_url

        # Check that the location was stored in the session
        expect(session["user_return_to"]).to eq(public_url)
      end
    end

    context "when user signs in after visiting public link" do
      it "redirects back to the public link after successful sign in" do
        # First, visit the public link without being signed in
        get public_url
        expect(response).to redirect_to(new_user_session_path)
        expect(session["user_return_to"]).to eq(public_url)

        # Now sign in
        post user_session_path, params: {
          user: {
            email: pawel.email,
            password: "password"
          }
        }

        # Should redirect back to the original public link
        expect(response).to redirect_to(public_url)
        follow_redirect!

        # Should now successfully show the public document
        expect(response).to have_http_status(:ok)
        expect(response.body).to include("document")
      end
    end

    context "when user is already authenticated" do
      before { sign_in pawel }

      context "and public link has no allowed_emails restriction" do
        it "shows the public document" do
          get public_url

          expect(response).to have_http_status(:ok)
          expect(response.body).to include("document")
        end

        it "does not store location when already authenticated" do
          get public_url

          expect(session["user_return_to"]).to be_nil
        end
      end

      context "and public link has allowed_emails restriction" do
        context "and user email is in allowed_emails list" do
          before do
            public_link.update!(allowed_emails: ["pawel@ikigai.systems", "stefan@ikigai.systems"])
          end

          it "shows the public document" do
            get public_url

            expect(response).to have_http_status(:ok)
            expect(response.body).to include("document")
          end
        end

        context "and user email is not in allowed_emails list" do
          before do
            public_link.update!(allowed_emails: ["stefan@ikigai.systems", "maria@ikigai.systems"])
          end

          it "returns forbidden status" do
            get public_url

            expect(response).to have_http_status(:forbidden)
          end
        end

        context "and allowed_emails list is empty after normalization" do
          before do
            public_link.update!(allowed_emails: ["", " ", nil])
          end

          it "shows the public document (empty list means no restriction)" do
            get public_url

            expect(response).to have_http_status(:ok)
            expect(response.body).to include("document")
          end
        end
      end
    end

    context "when accessing non-existent public link" do
      before { sign_in pawel }

      it "responds with not found status" do
        get "/public/nonexistent"

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "GET #attachment" do
    let(:organization) { organizations(:is) }
    let(:space) { spaces(:is_default) }
    let(:attachment) { Attachment.create!(organization: organization, parent: document, filename: "test.txt", mime_type: "text/plain", data: "test data") }

    context "when user is not authenticated" do
      context "and public link has no allowed_emails restriction" do
        it "redirects to sign in page" do
          get "/public/attachments/#{attachment.id}"

          expect(response).to redirect_to(new_user_session_path)
        end
      end

      context "and public link has allowed_emails restriction" do
        before do
          public_link.update!(allowed_emails: ["pawel@ikigai.systems", "stefan@ikigai.systems"])
        end

        it "redirects to sign in page" do
          get "/public/attachments/#{attachment.id}"

          expect(response).to redirect_to(new_user_session_path)
        end
      end
    end

    context "when user is authenticated" do
      before { sign_in pawel }

      context "when attachment belongs to a document with public link" do
        context "and public link has no allowed_emails restriction" do
          it "serves the attachment" do
            # Create a public link for the document that the attachment belongs to
            public_link
            
            get "/public/attachments/#{attachment.id}"

            expect(response).to have_http_status(:ok)
          end
        end

        context "and public link has allowed_emails restriction" do
          context "and user email is in allowed_emails list" do
            before do
              public_link.update!(allowed_emails: ["pawel@ikigai.systems", "stefan@ikigai.systems"])
            end

            it "serves the attachment" do
              get "/public/attachments/#{attachment.id}"

              expect(response).to have_http_status(:ok)
            end
          end

          context "and user email is not in allowed_emails list" do
            before do
              public_link.update!(allowed_emails: ["stefan@ikigai.systems", "maria@ikigai.systems"])
            end

            it "returns forbidden status" do
              get "/public/attachments/#{attachment.id}"

              expect(response).to have_http_status(:forbidden)
            end
          end
        end
      end

      context "when attachment does not belong to a public document" do
        let(:private_document) { Document.create!(organization: organization, space: space) }
        let(:private_attachment) { Attachment.create!(organization: organization, parent: private_document, filename: "private.txt", mime_type: "text/plain", data: "private data") }

        it "returns unauthorized" do
          get "/public/attachments/#{private_attachment.id}"

          expect(response).to have_http_status(:unauthorized)
        end
      end
    end
  end

  describe "storing location behavior" do
    context "for GET requests" do
      it "stores location for public document access" do
        get public_url

        expect(session["user_return_to"]).to eq(public_url)
      end
    end

    context "for non-GET requests" do
      it "does not store location for POST requests" do
        post public_url

        expect(session["user_return_to"]).to be_nil
      end
    end

    context "for AJAX requests" do
      it "does not store location for XHR requests" do
        get public_url, xhr: true

        expect(session["user_return_to"]).to be_nil
      end
    end
  end
end