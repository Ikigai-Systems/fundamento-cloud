module Api::V1
  class PackVersionsController < Api::ApiController
    before_action :load_pack

    def create
      @pack_version = @pack.versions.create!(
        organization_id: @pack.organization_id
      )

      render json: @pack_version
    end

    # How to upload files directly to S3
    # First register a version
    # CONTENT_MD5=$(openssl dgst -md5 -binary package.json | openssl enc -base64)
    # CONTENT_LENGTH=$(stat -f%z package.json)
    # http POST http://localhost:3000/api/v1/packs/xoeTe58wpB/versions/3/register checksum=$CONTENT_MD5 byte_size=$CONTENT_LENGTH
    # Then upload the file using http:
    # curl -X PUT \
    #      -H "Content-Type: application/json" \
    #      -H "Content-MD5: $CONTENT_MD5" \
    #      -H "Content-Length: $CONTENT_LENGTH" \
    #      -H "Accept:" \
    #      -H "User-Agent:" \
    #      --data-binary @package.json \
    #      "http://localhost:9000/development/packs/xoeTe58wpB/3/bundle.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=hYavubj2wLp7BGj3i5TB%2F20241025%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20241025T114928Z&X-Amz-Expires=300&X-Amz-SignedHeaders=content-length%3Bcontent-md5%3Bcontent-type%3Bhost&X-Amz-Signature=dc9a70fd5959ebd5be714e683131db5e5e79df2aa4d7dc4654ad66056a52bc4e"
    def register
      @pack_version = @pack.versions.find_by_version!(params[:version])

      blob = ActiveStorage::Blob.create_before_direct_upload!(
        key: "packs/#{params[:pack_npi]}/#{params[:version]}/bundle.json",
        filename: "bundle.json",
        content_type: "application/json",
        byte_size: params[:byte_size],
        checksum: params[:checksum],
      )

      render json: { url: blob.service_url_for_direct_upload, blob_id: blob.id }
    end

    # FIXME: it's broken
    def update
      @pack_version = @pack.versions.find_by_version!(params[:version])

      if @pack_version.update(params.require(:bundle))
        render json: @pack_version
      else
        render json: @pack_version.errors, status: :unprocessable_entity
      end
    end

    private

    def load_pack
      @pack = Pack.find_by_npi!(params[:pack_npi])
    end
  end
end