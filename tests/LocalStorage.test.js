import { beforeEach, describe, expect, it } from "vitest";
import { init } from "../src/js/LocalStorage.js";

function clearStorage() {
  if (typeof localStorage.clear === "function") {
    localStorage.clear();
    return;
  }
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

describe("LocalStorage", () => {
  beforeEach(() => {
    clearStorage();
  });

  it("scopes keys under the app id", () => {
    const storage = init("test-app");
    storage.store("encodedjwt", "token-value");

    expect(storage.get("encodedjwt")).toBe("token-value");
    expect(localStorage.getItem("test-app.datamodel.encodedjwt")).toBe(
      "token-value",
    );
  });

  it("removes stored values", () => {
    const storage = init("test-app");
    storage.store("sel-variant", "Signed");
    storage.remove("sel-variant");

    expect(storage.get("sel-variant")).toBeNull();
  });
});