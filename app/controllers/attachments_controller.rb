class AttachmentsController < ApplicationController
  def show
    @attachment = current_organization.attachments.find(params[:id])

    send_data @attachment.data, :type => @attachment.mime_type, :disposition => 'inline'
  end

  def create

    # build a photo and pass it into a block to set other attributes
    @attachment = current_organization.attachments.new(params[:attachment]) do |t|
      if params[:file]
        t.data      = params[:file].read
        t.filename  = params[:file].original_filename
        t.mime_type = params[:file].content_type
      end
    end

    if @attachment.save
      render json: @attachment.as_json(:except => [:data]).merge({location: attachment_url(@attachment)}), status: :created
    else
      render json: @attachment.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @attachment = current_organization.attachments.find(params[:id])
    @attachment.destroy
  end
end
