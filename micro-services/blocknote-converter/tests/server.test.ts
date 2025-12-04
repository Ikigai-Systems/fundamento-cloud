import {describe, it, expect, beforeAll, afterAll} from "vitest";
import {startServer} from "../src/server";
import {convertToYjs} from "../src/converters";
import sampleBlocks from "./fixtures/sample_blocks.json";
import type {FastifyInstance} from "fastify";

describe("Server Tests", () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    // Start server on a test port
    server = await startServer(0, "127.0.0.1");
  });

  afterAll(async () => {
    await server.close();
  });

  describe("POST /convert/yjs/blocks", () => {
    it("should convert YJS to blocks successfully", async () => {
      const yjsData = convertToYjs(sampleBlocks);
      const yjs = Buffer.from(yjsData).toString("base64");

      const response = await server.inject({
        method: "POST",
        url: "/convert/yjs/blocks",
        payload: {yjs}
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("blocks");
      expect(Array.isArray(body.blocks)).toBe(true);
      expect(body.blocks.length).toBeGreaterThan(0);
    });

    it("should return 400 when yjs field is missing", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/convert/yjs/blocks",
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("error");
      expect(body.error).toContain("Missing required field: yjs");
    });

    it("should return 400 when yjs is invalid base64", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/convert/yjs/blocks",
        payload: {yjs: "not-valid-base64!!!"}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("error");
    });
  });

  describe("POST /convert/blocks/yjs", () => {
    it("should convert blocks to YJS successfully", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/convert/blocks/yjs",
        payload: {blocks: sampleBlocks}
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("yjs");
      expect(typeof body.yjs).toBe("string");
      expect(body.yjs.length).toBeGreaterThan(0);
    });

    it("should return 400 when blocks field is missing", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/convert/blocks/yjs",
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("error");
      expect(body.error).toContain("Missing required field: blocks");
    });

    it("should handle empty blocks array", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/convert/blocks/yjs",
        payload: {blocks: []}
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("yjs");
      expect(typeof body.yjs).toBe("string");
    });
  });

  describe("POST /convert/markdown/blocks", () => {
    it("should convert markdown to blocks successfully", async () => {
      const markdown = "# Test Heading\n\nThis is a paragraph.";

      const response = await server.inject({
        method: "POST",
        url: "/convert/markdown/blocks",
        payload: {markdown}
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("blocks");
      expect(Array.isArray(body.blocks)).toBe(true);
      expect(body.blocks.length).toBeGreaterThan(0);
    });

    it("should return 400 when markdown field is missing", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/convert/markdown/blocks",
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("error");
      expect(body.error).toContain("Missing required field: markdown");
    });

    it("should handle empty markdown as error", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/convert/markdown/blocks",
        payload: {markdown: ""}
      });

      // Empty markdown causes conversion error
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("error");
    });

    it("should handle complex markdown with formatting", async () => {
      const markdown = "## Heading 2\n\nParagraph with **bold** and *italic* text.\n\n- List item 1\n- List item 2";

      const response = await server.inject({
        method: "POST",
        url: "/convert/markdown/blocks",
        payload: {markdown}
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.blocks.length).toBeGreaterThan(0);
    });
  });

  describe("POST /convert/blocks/markdown", () => {
    it("should convert blocks to markdown successfully", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/convert/blocks/markdown",
        payload: {blocks: sampleBlocks}
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("markdown");
      expect(typeof body.markdown).toBe("string");
      expect(body.markdown.length).toBeGreaterThan(0);
    });

    it("should return 400 when blocks field is missing", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/convert/blocks/markdown",
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("error");
      expect(body.error).toContain("Missing required field: blocks");
    });

    it("should handle empty blocks array", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/convert/blocks/markdown",
        payload: {blocks: []}
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("markdown");
      expect(typeof body.markdown).toBe("string");
    });
  });

  describe("Integration workflows", () => {
    it("should handle full YJS -> Blocks -> YJS cycle", async () => {
      // Convert blocks to YJS
      const response1 = await server.inject({
        method: "POST",
        url: "/convert/blocks/yjs",
        payload: {blocks: sampleBlocks}
      });

      const {yjs} = JSON.parse(response1.body);

      // Convert YJS back to blocks
      const response2 = await server.inject({
        method: "POST",
        url: "/convert/yjs/blocks",
        payload: {yjs}
      });

      expect(response2.statusCode).toBe(200);
      const {blocks} = JSON.parse(response2.body);
      expect(blocks.length).toBe(sampleBlocks.length);

      // Convert back to YJS again
      const response3 = await server.inject({
        method: "POST",
        url: "/convert/blocks/yjs",
        payload: {blocks}
      });

      expect(response3.statusCode).toBe(200);
      const body3 = JSON.parse(response3.body);
      expect(body3).toHaveProperty("yjs");
    });

    it("should handle full Markdown -> Blocks -> Markdown cycle", async () => {
      const originalMarkdown = "# Title\n\nParagraph with **bold** text.";

      // Convert markdown to blocks
      const response1 = await server.inject({
        method: "POST",
        url: "/convert/markdown/blocks",
        payload: {markdown: originalMarkdown}
      });

      const {blocks} = JSON.parse(response1.body);

      // Convert blocks back to markdown
      const response2 = await server.inject({
        method: "POST",
        url: "/convert/blocks/markdown",
        payload: {blocks}
      });

      expect(response2.statusCode).toBe(200);
      const {markdown} = JSON.parse(response2.body);
      expect(typeof markdown).toBe("string");
      expect(markdown.length).toBeGreaterThan(0);
    });

    it("should handle concurrent requests", async () => {
      const requests = Array.from({length: 5}, (_, i) => {
        const markdown = `# Heading ${i}\n\nParagraph ${i}`;
        return server.inject({
          method: "POST",
          url: "/convert/markdown/blocks",
          payload: {markdown}
        });
      });

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty("blocks");
      });
    });

    it("should handle mixed sequential requests", async () => {
      // Convert markdown to blocks
      const response1 = await server.inject({
        method: "POST",
        url: "/convert/markdown/blocks",
        payload: {markdown: "# Test"}
      });

      expect(response1.statusCode).toBe(200);

      // Convert blocks to YJS
      const {blocks} = JSON.parse(response1.body);
      const response2 = await server.inject({
        method: "POST",
        url: "/convert/blocks/yjs",
        payload: {blocks}
      });

      expect(response2.statusCode).toBe(200);

      // Convert YJS back to blocks
      const {yjs} = JSON.parse(response2.body);
      const response3 = await server.inject({
        method: "POST",
        url: "/convert/yjs/blocks",
        payload: {yjs}
      });

      expect(response3.statusCode).toBe(200);
      const body3 = JSON.parse(response3.body);
      expect(body3.blocks.length).toBeGreaterThan(0);
    });
  });

  describe("Error handling", () => {
    it("should handle malformed JSON gracefully", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/convert/yjs/blocks",
        payload: "not json",
        headers: {
          "content-type": "application/json"
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it("should handle invalid blocks structure", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/convert/blocks/yjs",
        payload: {blocks: "not an array"}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty("error");
    });
  });
});
