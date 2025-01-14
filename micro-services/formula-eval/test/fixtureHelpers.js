import fs from "node:fs";

export function fileFixture(fixtureName) {
  return fs.readFileSync(`./test/fixtures/${fixtureName}`).toString("utf8");
}

export function jsonFixture(fixtureName) {
  return JSON.parse(fileFixture(fixtureName));
}
