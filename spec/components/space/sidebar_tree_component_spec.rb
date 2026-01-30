# frozen_string_literal: true

require "rails_helper"

RSpec.describe Space::SidebarTreeComponent, type: :component do
  fixtures :organizations, :spaces, :users, :documents

  let(:organization) { Organization.find("is") }
  let(:space) { Space.find("is_default") }
  let(:user) { User.find("user_stefan") }
  let(:doc1) { Document.find("one") }
  let(:doc2) { Document.find("two") }
  let(:document_list) { [doc1, doc2] }
  let(:params) { {} }

  before do
    allow_any_instance_of(Space::SidebarTreeItemComponent).to receive(:cookies)
      .and_return({})
    allow_any_instance_of(Space::SidebarTreeItemComponent).to receive(:helpers)
      .and_return(
        double(
          pundit_user: PolicyUserContext.new(user, organization),
          protect_against_forgery?: false
        )
      )
  end

  def render_tree(**options)
    with_request_url("/") do
      render_inline(described_class.new(**options))
    end
  end

  describe "with flat hierarchy" do
    let(:node) do
      [
        { "id" => doc1.id, "children" => [] },
        { "id" => doc2.id, "children" => [] }
      ]
    end

    it "renders all documents" do
      result = render_tree(
        node: node,
        documents: document_list,
        space: space,
        params: params,
        level: 0
      )

      expect(result.to_html).to include(doc1.title)
      expect(result.to_html).to include(doc2.title)
    end
  end

  describe "with nested hierarchy" do
    let(:node) do
      [
        {
          "id" => doc1.id,
          "children" => [
            { "id" => doc2.id, "children" => [] }
          ]
        }
      ]
    end

    it "renders parent and child" do
      result = render_tree(
        node: node,
        documents: document_list,
        space: space,
        params: params,
        level: 0
      )

      expect(result.to_html).to include(doc1.title)
      expect(result.to_html).to include(doc2.title)
    end

    it "adds collapsible controller to parent" do
      result = render_tree(
        node: node,
        documents: document_list,
        space: space,
        params: params,
        level: 0
      )

      expect(result.to_html).to match(/data-controller="[^"]*collapsible/)
    end
  end

  describe "selected state" do
    let(:node) { [{ "id" => doc1.id, "children" => [] }] }
    let(:params) { { object: { id: doc1.id, type: "Document" } } }

    it "adds scroll-into-view controller" do
      result = render_tree(
        node: node,
        documents: document_list,
        space: space,
        params: params,
        level: 0
      )

      expect(result.to_html).to match(/data-controller="[^"]*scroll-into-view/)
    end
  end
end
