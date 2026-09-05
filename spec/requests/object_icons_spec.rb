# frozen_string_literal: true
require "rails_helper"

# Phase 1 moved the emoji out of stored titles. Every surface that renders a
# title from JSON therefore needs the icon alongside it, or the emoji simply
# disappears from that surface.
RSpec.describe "Object icons in JSON payloads", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:pawel) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }

  before do
    sign_in pawel
    post select_organization_path(organization)
  end

  describe "GET /search" do
    it "sends the icon so the command palette can render it" do
      documents(:one).update!(title: "⭐ Roadmap")

      get search_path(format: :json)

      result = JSON.parse(response.body).find { |r| r.dig("object", "id") == documents(:one).id }
      expect(result["object"]).to include("title" => "Roadmap")
      expect(result["object"]["icon"]).to eq({"type" => "emoji", "value" => "⭐"})
    end

    it "sends a nil icon for objects without one" do
      documents(:one).update!(title: "Roadmap")

      get search_path(format: :json)

      result = JSON.parse(response.body).find { |r| r.dig("object", "id") == documents(:one).id }
      expect(result["object"]).to include("icon" => nil)
    end
  end

  describe "GET /d?mention=true" do
    it "sends the icon for the @ menu" do
      documents(:one).update!(title: "⭐ Roadmap")

      get documents_path(format: :json, mention: true)

      result = JSON.parse(response.body).find { |d| d["id"] == documents(:one).id }
      expect(result).to include("title" => "Roadmap")
      expect(result["icon"]).to eq({"type" => "emoji", "value" => "⭐"})
    end
  end

  describe "GET /t?mention=true" do
    # The `only:` list here is maintained separately from the documents one, so
    # it is worth pinning independently.
    it "sends the icon for the @ menu" do
      table = Table.create!(name: "📊 Metrics", organization: organization, space: space, parent: space)

      get tables_path(format: :json, mention: true)

      result = JSON.parse(response.body).find { |t| t["id"] == table.id }
      expect(result).to include("name" => "Metrics")
      expect(result["icon"]).to eq({"type" => "emoji", "value" => "📊"})
    end
  end

  describe "GET /d/:id" do
    it "sends the icon so a rendered mention can show it" do
      documents(:one).update!(title: "⭐ Roadmap")

      get document_path(documents(:one), format: :json)

      expect(JSON.parse(response.body)["icon"]).to eq({"type" => "emoji", "value" => "⭐"})
    end
  end

  describe "GET /t/:id" do
    # The table block inside a document builds its editable title from this
    # payload, so it needs the same combined string the page-level title gets.
    it "sends the string the inline title field should show" do
      table = Table.create!(name: "\u{1F4CA} Metrics", organization: organization, space: space, parent: space)

      get table_path(table, format: :json)

      json = JSON.parse(response.body)["table"]
      expect(json["name"]).to eq("Metrics")
      expect(json["icon"]).to eq({"type" => "emoji", "value" => "\u{1F4CA}"})
      expect(json["title_for_editing"]).to eq("\u{1F4CA} Metrics")
    end
  end

  describe "PATCH /d/:id" do
    # The client uses the response rather than the string it typed, which is why
    # no JavaScript needs its own emoji matcher.
    it "returns the normalized split and the string the edit field should show" do
      patch document_path(documents(:one), format: :json), params: {document: {title: "⭐ Roadmap"}}

      json = JSON.parse(response.body)
      expect(json["title"]).to eq("Roadmap")
      expect(json["icon"]).to eq({"type" => "emoji", "value" => "⭐"})
      expect(json["title_for_editing"]).to eq("⭐ Roadmap")
    end
  end
end
