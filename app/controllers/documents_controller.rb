class DocumentsController < ApplicationController
  before_action :set_document, only: %i[ show update destroy ]

  def index
    @documents = Document.all

    render json: @documents
  end

  def show
    render json: @document
  end

  def create
    @document = Document.new(post_params)

    if @document.save
      render json: @document, status: :created, location: @document
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
      params.require(:document).permit(:content)
    end
end
