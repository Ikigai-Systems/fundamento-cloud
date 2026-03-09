require "active_storage/service/s3_service"

# Custom ActiveStorage S3 service for MinIO in E2E Docker environments.
#
# In E2E, the Rails containers connect to MinIO internally via the Docker service
# hostname (e.g. http://minio:9000), but presigned direct upload URLs must use
# the host-mapped port (e.g. http://localhost:10000) so browsers outside Docker
# can reach them.
#
# Uses two S3 clients:
#   - @client (from parent): internal endpoint for all actual S3 operations
#   - @public_resource: public endpoint for generating presigned URLs
#
# Configure in storage.yml with both +endpoint+ (internal) and +public_endpoint+
# (browser-accessible).
class ActiveStorage::Service::MinioE2eService < ActiveStorage::Service::S3Service
  def initialize(public_endpoint:, **options)
    @public_endpoint = public_endpoint
    @s3_config = options.slice(:access_key_id, :secret_access_key, :region, :force_path_style)
    super(**options)
  end

  # Generate presigned PUT URLs using the browser-accessible public endpoint.
  # The internal @client endpoint is used for all other S3 operations.
  def url_for_direct_upload(key, expires_in:, content_type:, content_length:, checksum:, custom_metadata: {})
    instrument :url, key: key do |payload|
      generated_url = public_object_for(key).presigned_url :put, expires_in: expires_in.to_i,
        content_type: content_type, content_length: content_length, content_md5: checksum,
        metadata: custom_metadata, whitelist_headers: ["content-length"], **upload_options
      payload[:url] = generated_url
      generated_url
    end
  end

  private

  def public_object_for(key)
    public_bucket.object(key)
  end

  def public_bucket
    @public_bucket ||= public_resource.bucket(bucket.name)
  end

  def public_resource
    @public_resource ||= Aws::S3::Resource.new(
      **@s3_config,
      endpoint: @public_endpoint
    )
  end
end
