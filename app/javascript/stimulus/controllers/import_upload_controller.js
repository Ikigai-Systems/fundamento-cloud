import { Controller } from "@hotwired/stimulus"
import SparkMD5 from "spark-md5"

const MAX_FILES = 500
const MAX_TOTAL_BYTES = 1 * 1024 * 1024 * 1024 // 1 GB
const UPLOAD_CONCURRENCY = 3

export default class extends Controller {
  static targets = [
    "stepConfigure", "stepFiles", "stepUploading", "stepProcessing",
    "spaceSelect", "formatSelect",
    "dropZone", "fileSummary", "fileCount", "totalSize", "limitError",
    "sessionId", "uploadBar", "uploadedCount", "uploadTotal",
    "processingStatus"
  ]

  static values = {
    apiUrl: String,
    spaceOptions: Array
  }

  connect() {
    this.files = [] // Array of { file, relativePath }
    this.sessionId = null
    this.uploadedCount = 0
  }

  // ── Step navigation ───────────────────────────────────────────────

  nextStep() {
    this.stepConfigureTarget.classList.add("hidden")
    this.stepFilesTarget.classList.remove("hidden")
  }

  // ── File selection ────────────────────────────────────────────────

  dragOver(event) {
    event.preventDefault()
    this.dropZoneTarget.classList.add("!border-blue-500")
  }

  async drop(event) {
    event.preventDefault()
    this.dropZoneTarget.classList.remove("!border-blue-500")
    const items = Array.from(event.dataTransfer.items)
    const entries = items.map(item => item.webkitGetAsEntry?.()).filter(Boolean)
    const collected = []
    if (entries.length > 0) {
      // File System API path (real browser drag-drop with folder support)
      for (const entry of entries) {
        await this.#collectEntry(entry, "", collected)
      }
    } else {
      // Fallback: plain dataTransfer.files (Cypress simulation, no folder traversal)
      for (const file of Array.from(event.dataTransfer.files)) {
        collected.push({ file, relativePath: file.name })
      }
    }
    this.#setFiles(collected)
  }

  filesSelected(event) {
    const fileList = Array.from(event.target.files)
    const collected = fileList.map(f => ({
      file: f,
      relativePath: f.webkitRelativePath || f.name
    }))
    this.#setFiles(collected)
  }

  #setFiles(collected) {
    this.files = collected
    const totalBytes = collected.reduce((sum, f) => sum + f.file.size, 0)

    if (collected.length > MAX_FILES) {
      this.limitErrorTarget.textContent = `Too many files: ${collected.length} (max ${MAX_FILES})`
      this.limitErrorTarget.classList.remove("hidden")
      this.fileSummaryTarget.classList.remove("hidden")
      return
    }

    if (totalBytes > MAX_TOTAL_BYTES) {
      this.limitErrorTarget.textContent = `Total size too large: ${this.#formatBytes(totalBytes)} (max 1 GB)`
      this.limitErrorTarget.classList.remove("hidden")
      this.fileSummaryTarget.classList.remove("hidden")
      return
    }

    this.limitErrorTarget.classList.add("hidden")
    this.fileCountTarget.textContent = collected.length
    this.totalSizeTarget.textContent = this.#formatBytes(totalBytes)
    this.fileSummaryTarget.classList.remove("hidden")
  }

  async #collectEntry(entry, prefix, results) {
    if (entry.isFile) {
      const file = await new Promise(resolve => entry.file(resolve))
      results.push({ file, relativePath: prefix ? `${prefix}/${entry.name}` : entry.name })
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const entries = await new Promise(resolve => reader.readEntries(resolve))
      for (const child of entries) {
        await this.#collectEntry(child, prefix ? `${prefix}/${entry.name}` : entry.name, results)
      }
    }
  }

  // ── Upload ────────────────────────────────────────────────────────

  async startUpload() {
    const spaceId = this.spaceSelectTarget.value
    const sourceFormat = this.formatSelectTarget.value

    this.stepFilesTarget.classList.add("hidden")
    this.stepUploadingTarget.classList.remove("hidden")

    // Create session
    const sessionRes = await fetch(this.apiUrlValue, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": this.#csrfToken() },
      body: JSON.stringify({ space_id: spaceId, source_format: sourceFormat })
    })
    const session = await sessionRes.json()
    this.sessionId = session.id
    this.sessionIdTarget.textContent = session.id

    // Submit manifest
    const manifest = await this.#buildManifest()
    const manifestRes = await fetch(`${this.apiUrlValue}/${session.id}/manifest`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": this.#csrfToken() },
      body: JSON.stringify({ files: manifest })
    })
    const fileEntries = await manifestRes.json()

    const toUpload = fileEntries.filter(f => f.direct_upload_url)
    this.uploadTotalTarget.textContent = toUpload.length
    this.uploadedCountTarget.textContent = 0
    this.uploadedCount = 0

    // Upload with concurrency limit
    await this.#uploadWithConcurrency(toUpload, UPLOAD_CONCURRENCY, session.id)

    // Trigger processing
    await fetch(`${this.apiUrlValue}/${session.id}/process`, {
      method: "POST",
      headers: { "X-CSRF-Token": this.#csrfToken() }
    })

    this.stepUploadingTarget.classList.add("hidden")
    this.stepProcessingTarget.classList.remove("hidden")

    // Redirect to session show page
    window.location.href = `/import_sessions/${session.id}`
  }

  async #buildManifest() {
    return Promise.all(this.files.map(async ({ file, relativePath }) => {
      const checksum = await this.#md5Base64(file)
      return {
        relative_path: relativePath,
        checksum,
        file_size: file.size,
        format: this.#detectFormat(file.name),
        file_type: this.#isAttachment(file.name) ? "attachment" : "document"
      }
    }))
  }

  async #uploadWithConcurrency(entries, concurrency, sessionId) {
    const queue = [...entries]
    const workers = Array.from({ length: concurrency }, () => this.#worker(queue, sessionId))
    await Promise.all(workers)
  }

  async #worker(queue, sessionId) {
    while (queue.length > 0) {
      const entry = queue.shift()
      if (!entry) break
      await this.#uploadFile(entry, sessionId)
    }
  }

  async #uploadFile(entry, sessionId) {
    const fileData = this.files.find(f => f.relativePath === entry.relative_path)
    if (!fileData) return

    const uploadRes = await fetch(entry.direct_upload_url, {
      method: "PUT",
      headers: entry.direct_upload_headers || { "Content-Type": entry.content_type || "application/octet-stream" },
      body: fileData.file
    })
    if (!uploadRes.ok) throw new Error(`Upload failed for ${entry.relative_path}: HTTP ${uploadRes.status}`)

    await fetch(`${this.apiUrlValue}/${sessionId}/import_files/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": this.#csrfToken() },
      body: JSON.stringify({ status: "uploaded" })
    })

    this.uploadedCount++
    this.uploadedCountTarget.textContent = this.uploadedCount
    const pct = Math.round((this.uploadedCount / parseInt(this.uploadTotalTarget.textContent)) * 100)
    this.uploadBarTarget.style.width = `${pct}%`
  }

  // ── Utilities ─────────────────────────────────────────────────────

  async #md5Base64(file) {
    return new Promise((resolve, reject) => {
      const CHUNK = 2 * 1024 * 1024 // 2 MB chunks
      const spark = new SparkMD5.ArrayBuffer()
      const reader = new FileReader()
      let offset = 0

      const readNext = () => {
        const slice = file.slice(offset, offset + CHUNK)
        reader.readAsArrayBuffer(slice)
      }

      reader.onload = (e) => {
        spark.append(e.target.result)
        offset += CHUNK
        if (offset < file.size) {
          readNext()
        } else {
          const hex = spark.end()
          // Convert hex to base64 (ActiveStorage expects MD5 as base64)
          const bytes = new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)))
          resolve(btoa(String.fromCharCode(...bytes)))
        }
      }

      reader.onerror = () => reject(reader.error)
      readNext()
    })
  }

  #detectFormat(filename) {
    const ext = filename.split(".").pop().toLowerCase()
    const docFormats = { md: "markdown", docx: "docx", odt: "odt", doc: "doc" }
    const attachFormats = { png: "image", jpg: "image", jpeg: "image", gif: "image",
                            webp: "image", svg: "image", pdf: "pdf",
                            mp4: "video", mov: "video", avi: "video" }
    return docFormats[ext] || attachFormats[ext] || "other"
  }

  #isAttachment(filename) {
    const attachExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "pdf", "mp4", "mov", "avi",
                        "zip", "tar", "gz", "xlsx", "csv"]
    const ext = filename.split(".").pop().toLowerCase()
    return attachExts.includes(ext)
  }

  #formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  #csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content
  }
}
