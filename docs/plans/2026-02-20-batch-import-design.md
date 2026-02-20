# Batch Import Design

**Date:** 2026-02-20
**Status:** Approved

## Overview

Replace the existing single-file `DocumentImport` mechanism with a robust batch import
system capable of importing large document collections (e.g. an 8 GB Obsidian vault)
with resumability, direct-to-S3 uploads, per-file progress tracking, wiki link
resolution, and attachment handling.

The primary use cases are:
- **CLI** (`funcli import start`) for large vaults (thousands of files, gigabytes of data)
- **Web UI** for small teams importing 10–30 documents with drag-and-drop

## What Gets Removed

- `DocumentImport` model, table, controller, job, policy, and views — dropped entirely
  (not currently visible to users)
- `has_one :import` association on `Document`
- `documents import` subcommand on `fundamento-cli` (replaced by `import start`)

## Data Model

### `ImportSession`

Represents the overall batch operation. Replaces `DocumentImport`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | string (NPI) | |
| `organization_id` | FK | |
| `space_id` | FK | |
| `organization_membership_id` | FK | |
| `status` | enum | `pending \| uploading \| processing \| completed \| failed \| partial` |
| `source_format` | string | `generic \| obsidian` — drives link/attachment processing |
| `total_files` | integer | set when manifest is first submitted |
| `uploaded_files` | integer | atomic counter |
| `processed_files` | integer | atomic counter |
| `failed_files` | integer | atomic counter |
| `skipped_files` | integer | atomic counter |
| `path_map` | jsonb | `{ "relative/path.md" => "doc_id", "assets/img.png" => "att_id" }` |
| `settings` | jsonb | e.g. `{ "ignore_patterns": ["*.excalidraw"] }` |
| `expires_at` | datetime | unfinished upload TTL, default 7 days |
| `started_processing_at` | datetime | |
| `completed_processing_at` | datetime | |
| `created_at` | datetime | automatic |
| `updated_at` | datetime | automatic |

### `ImportFile`

One record per file in the batch. These records are the import log.

| Column | Type | Notes |
|--------|------|-------|
| `id` | string (NPI) | |
| `import_session_id` | FK | |
| `relative_path` | string | e.g. `"Notes/Projects/my-doc.md"` |
| `file_type` | enum | `document \| attachment` |
| `format` | string | `markdown \| docx \| odt \| image \| pdf \| video \| other` |
| `status` | enum | `pending \| uploading \| uploaded \| processing \| completed \| failed \| skipped` |
| `checksum` | string | SHA-256 — enables resumability |
| `file_size` | bigint | bytes |
| `document_id` | FK (nullable) | set after processing |
| `error_message` | text | |
| `uploaded_at` | datetime | when file arrived in S3 |
| `processed_at` | datetime | when document was created |
| `created_at` | datetime | automatic — when manifest was submitted |
| `updated_at` | datetime | automatic |
| `has_one_attached :file` | ActiveStorage | blob created before upload |

**Resumability** is driven by `checksum`: when the CLI resubmits a manifest, the server
skips any `ImportFile` with `status: uploaded` and matching checksum, returning presigned
URLs only for files that still need uploading.

**Hierarchy** is reconstructed from `relative_path`. Directory documents are created
depth-first (shallowest first) before document processing begins.

## API

### Endpoints

```
POST   /api/v1/import_sessions
       Body: { space_id, source_format, settings }
       Returns: { id, status, expires_at }

GET    /api/v1/import_sessions/:id
       Returns: session status, counters, and ImportFile list
       Used by CLI polling and web UI progress view

POST   /api/v1/import_sessions/:id/manifest
       Body: [{ relative_path, checksum, file_size, format, file_type }]
       Creates ImportFile records for new entries, skips already-uploaded ones
       Returns: [{ id, relative_path, status, direct_upload_url, signed_blob_id }]
       Only files needing upload get a direct_upload_url

PATCH  /api/v1/import_sessions/:id/files/:file_id
       Body: { status: "uploaded" }
       Called by client after each file reaches S3
       Sets uploaded_at, increments session counter atomically

POST   /api/v1/import_sessions/:id/process
       Triggers processing jobs
       Returns 422 if any files are still pending/uploading

POST   /api/v1/import_sessions/:id/retry
       Re-enqueues failed ImportFiles — no re-upload needed

DELETE /api/v1/import_sessions/:id
       Cancels session, cleans up blobs and records
```

### Upload flow

The `direct_upload_url` in the manifest response is generated via
`ActiveStorage::Blob.create_before_direct_upload!` — creates the blob record and returns
a presigned S3 PUT URL. The client uploads bytes directly to S3 (no Rails proxy). After
upload, the client calls `PATCH .../files/:id` to confirm.

This works identically for MinIO (development) and Amazon S3 (production) because
ActiveStorage abstracts the storage service.

### CLI resumability

Re-running `funcli import start` in a directory with a `.fundamento-session.json`:
1. CLI recomputes checksums
2. Resubmits full manifest
3. Server returns `direct_upload_url: null` for already-uploaded files
4. CLI uploads only the diff
5. If session is already `processing` or `completed`, server returns 422 with clear message

## Job Architecture

### Pipeline

```
POST .../process
       │
       ▼
ImportSessionOrchestratorJob
  ├─ creates parent directory documents (depth-first, shallowest first)
  ├─ enqueues ImportDocumentJob per document file   } in a Good Job batch
  └─ enqueues ImportAttachmentJob per attachment    }
       │
       ▼ (parallel, via Good Job batch)
ImportDocumentJob (one per document file)
  ├─ downloads blob from S3
  ├─ converts to markdown (PandocConverterService for docx/odt, passthrough for .md)
  ├─ extracts frontmatter + tags
  ├─ creates Document + Version via DocumentService
  ├─ writes relative_path → document_id to ImportSession#path_map (jsonb merge)
  └─ increments processed_files or failed_files counter

ImportAttachmentJob (one per attachment)
  ├─ blob already in S3, no download needed
  ├─ creates Attachment record pointing to the blob
  ├─ writes relative_path → attachment_id to ImportSession#path_map
  └─ increments processed_files counter
       │
       ▼ (Good Job batch on_finish callback)
ImportLinkResolutionJob (single job)
  ├─ loads full path_map from ImportSession
  ├─ for each document: scans blocks for [[wiki links]] and ![[attachment refs]]
  ├─ resolves to document links or attachment nodes
  ├─ unresolvable → broken-link marker node (preserves original [[...]] text)
  └─ updates Document#sync + creates new Version
       │
       ▼
ImportSessionCompletionJob
  ├─ sets status: completed / partial (if failed_files > 0)
  └─ sets completed_processing_at
```

### Failure handling

- Each `ImportDocumentJob` rescues its own errors, writes `error_message` to `ImportFile`,
  sets `status: failed`, increments `failed_files` — the batch continues
- `ImportLinkResolutionJob` is best-effort per document — a link resolution failure marks
  that document's links as unresolved but does not fail the session
- `POST .../retry` re-enqueues only `ImportFile` records with `status: failed`, reusing
  already-uploaded blobs — no re-upload needed
- The orchestrator is idempotent: re-run skips records already in `completed` or
  `processing` state

### Conversion unification

`ImportDocumentJob` is the single authoritative conversion path:

```
.md             → read directly → BlocknoteConverterService.markdown_to_blocks
.docx/.doc/.odt → PandocConverterService.file_to_markdown → markdown_to_blocks
```

The old `DocumentImportProcessorJob` (which used the incomplete `docx` gem) is deleted.
The REST API single-file create action continues using `DocumentService#create_from_file!`
as-is — no change needed there.

### Cleanup

A recurring Good Job cron task deletes `ImportSession` records where
`status IN ('pending', 'uploading') AND expires_at < NOW()`, cascading to their
`ImportFile` records and ActiveStorage blobs.

## Link Resolution & Attachment Handling

### Obsidian wiki link formats

```
[[filename]]              → link to document by filename (no extension)
[[filename#heading]]      → link to document with anchor
[[filename|alias]]        → link with custom display text
![[image.png]]            → inline image
![[video.mp4]]            → inline video
![[document.pdf]]         → inline file attachment
![[note.md]]              → treated as a link, not an embed
```

### Resolution

`ImportLinkResolutionJob` builds two lookup indices from `path_map`:
1. Full relative path → id (e.g. `"Notes/Projects/foo.md"`)
2. Basename without extension → id (e.g. `"foo"`) — Obsidian's default

If a basename appears in multiple paths, the closest ancestor is preferred (Obsidian
behaviour). Resolution results:

| Situation | Result |
|-----------|--------|
| `[[foo]]` resolves to a document | BlockNote internal document link node |
| `![[image.png]]` resolves to an attachment | BlockNote image node |
| `![[video.mp4]]` resolves to an attachment | BlockNote video node |
| `![[file.pdf]]` resolves to an attachment | BlockNote file node |
| Any link that cannot be resolved | Broken-link marker node |

### Attachment node URLs

BlockNote image/video/file nodes store their URL as `attachment:<id>`. The frontend's
`createFileUrlResolver` resolves this to the Rails `/attachments/:id` route, which
`AttachmentsController#show` handles with authorization before redirecting to the blob.
Direct S3 URLs are never stored in block content.

### Broken-link marker

A custom inline BlockNote node: `{ type: "broken_link", attrs: { original: "[[foo]]" } }`.
The original `[[...]]` text is preserved so users can identify and fix broken references
manually. These flow through the existing custom block pipeline.

## Web UI

### Technology

Hotwire (Stimulus + Turbo Streams) for page shell and progress updates. A focused
Stimulus controller handles file tree scanning, checksum computation, and upload
orchestration. ActionCable broadcasts `ImportSession` counter updates as Turbo Stream
fragments — no polling.

### Flow

**Step 1 — Configure:** select target space, source format. Submitting creates the
`ImportSession` and advances to Step 2.

**Step 2 — Select files:** drag-and-drop zone accepting:
- Dropped folder (traversed via `webkitGetAsEntry()`, preserving relative paths)
- Folder picker (`<input webkitdirectory>`)
- Multi-file selection (flat, all files at space root)

Stimulus controller builds an in-memory file tree, computes SHA-256 checksums via
`crypto.subtle.digest`, shows summary: `N documents, M attachments, X.XMB`.
Limits: **500 files max, 1 GB total** — error shown inline if exceeded.

**Step 3 — Upload:** controller submits manifest, receives presigned URLs, uploads
directly to S3 with concurrency limit of 3. After each file: `PATCH .../files/:id`.
Progress bar shows `uploaded / total`. No bytes through Rails.

**Step 4 — Processing:** controller calls `POST .../process`. Page shows live counters
via Turbo Streams. If tab is closed and reopened, current state is fetched on load.
A session in `uploading` state shows a "Resume" button that rehydrates the controller.

**Step 5 — Import log:** table of all `ImportFile` records:

| Path | Status | Result |
|------|--------|--------|
| `Notes/Projects/foo.md` | ✓ | [Link to document] |
| `assets/image.png` | ✓ | Attached |
| `Notes/broken.docx` | ✗ | Conversion failed: … |
| `archive/old.pages` | ⊘ | Unsupported format |

The `/imports` index lists past sessions with counters and a link back to the log.

## CLI Changes

### Command structure

The old `funcli documents import <space-id> <directory>` is replaced:

```
funcli import start <space-id> <directory>
  --format <generic|obsidian>   default: auto-detected from .obsidian/ presence
  --concurrency <n>             parallel uploads, default: 5
  --ignore <glob>               repeatable, e.g. "*.excalidraw" "*.canvas"
  --session-file <path>         default: .fundamento-session.json in source dir

funcli import status <session-id>
  Live-updating progress (polls every 2s)

funcli import cancel <session-id>
  Calls DELETE .../import_sessions/:id

funcli import retry <session-id>
  Re-enqueues failed files, no re-upload

funcli import log <session-id>
  Full import log table
  --failed-only
  --json
```

### Session file

`.fundamento-session.json` written to the source directory on `import start`:

```json
{
  "session_id": "abc123",
  "space_id": "xyz789",
  "server": "https://fundamento.cloud"
}
```

Re-running `import start` in the same directory automatically resumes. The active
session ID is shown prominently during upload so the user can cancel from another
terminal.

### Obsidian auto-detection

If `.obsidian/` directory is present, `--format obsidian` is set automatically with a
printed notice. Override with `--format generic`.

### Progress output

```
Fundamento Import — My Obsidian Vault → Space: Personal Wiki
──────────────────────────────────────────────────────────────
Scanning files...        4,821 files found (7.8 GB)
Submitting manifest...   3,102 files to upload (1,719 already uploaded)

Uploading  [████████████░░░░░░░░]  61%   1,892 / 3,102   12.3 MB/s
  ✓ Notes/Projects/architecture.md
  ✓ assets/diagram.png
  ✗ archive/old.pages  (unsupported format — skipped)

All files uploaded. Starting processing...
Session ID: abc123  (run `funcli import cancel abc123` to cancel)

Processing  [████████████████░░░░]  78%   2,419 / 3,102
  3 failed — run `funcli import log abc123 --failed-only` to see errors

✓ Import complete  (14 failed, 4,807 imported)
  View results: https://fundamento.cloud/imports/abc123
```
