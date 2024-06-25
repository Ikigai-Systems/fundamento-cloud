class Api::V1::DocumentsController < ApplicationController
  before_action :set_document, only: %i[ show update destroy ]

  def index
    @documents = Document.all

    render json: @documents, :except => [:sync]
  end

  def show
    render json: @document, :except => [:sync]
  end

  def create
    @document = Document.new(post_params)

    if @document.save
      render json: @document, status: :created, location: api_v1_document_url(@document)
    else
      render json: @document.errors, status: :unprocessable_entity
    end
  end

  def update
    if @document.update(post_params)
      render json: @document
    else
      render json: @document.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @document.destroy!
  end

  private
    def set_document
      @document = Document.find(params[:id])
    end

    def post_params
      params.fetch(:document, {}).permit(:content)
    end
end
