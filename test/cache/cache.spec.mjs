import { rmSync } from "fs";
import { join } from "path";
import { expect } from "chai";
import { describe } from "mocha";
import {
  readCache,
  writeCache,
  canServeFromCache,
} from "../../src/cache/cache.js";

const OUTPUTS_FOLDER = "test/cache/__outputs__/";

describe("[I] cache/cache - readCache", () => {
  it("returns an empty cache when trying to read from a non-existing one", () => {
    expect(readCache("this/folder/does/not-exist")).to.deep.equal({
      modules: [],
      summary: {},
    });
  });

  it("returns an empty cache when trying to read from a file that is invalid JSON", () => {
    expect(readCache("test/cache/__mocks__/cache/invalid-json")).to.deep.equal({
      modules: [],
      summary: {},
    });
  });

  it("returns the contents of the cache when trying to read from an existing, valid json", () => {
    expect(
      readCache("test/cache/__mocks__/cache/valid-minimal-cache")
    ).to.deep.equal({
      modules: [],
      summary: {},
      revisionData: {
        SHA1: "26fc7183127945393f77c8559f28bf623babe17f",
        changes: [],
      },
    });
  });
});

describe("[I] cache/cache - writeCache", () => {
  before("remove __outputs__ folder", () => {
    rmSync(OUTPUTS_FOLDER, { recursive: true, force: true });
  });
  after("remove __outputs__ folder", () => {
    rmSync(OUTPUTS_FOLDER, { recursive: true, force: true });
  });

  it("writes the passed cruise options to the cache folder (which is created when it doesn't exist yet)", () => {
    const lDummyCacheContents = {};
    const lCacheFolder = join(OUTPUTS_FOLDER, "write-cache");
    writeCache(lCacheFolder, lDummyCacheContents);
    expect(readCache(lCacheFolder)).to.deep.equal(lDummyCacheContents);
  });

  it("writes the passed cruise options to the cache folder (folder already exists -> overwrite)", () => {
    const lDummyCacheContents = {};
    const lSecondDummyCacheContents = {
      modules: [],
      summary: {},
      revisionData: { SHA1: "dummy-sha", changes: [] },
    };
    const lCacheFolder = join(OUTPUTS_FOLDER, "two-writes");
    writeCache(lCacheFolder, lDummyCacheContents);
    writeCache(lCacheFolder, lSecondDummyCacheContents);
    expect(readCache(lCacheFolder)).to.deep.equal(lSecondDummyCacheContents);
  });
});

describe("[I] cache/cache - canServeFromCache", () => {
  const lMinimalCruiseResult = {
    modules: [],
    summary: {
      optionsUsed: {
        args: "src test tools",
      },
    },
    revisionData: { SHA1: "dummy-sha", changes: [] },
  };

  before("remove __outputs__ folder", () => {
    rmSync(OUTPUTS_FOLDER, { recursive: true, force: true });
  });
  after("remove __outputs__ folder", () => {
    rmSync(OUTPUTS_FOLDER, { recursive: true, force: true });
  });

  it("returns false when cache not written yet", () => {
    const lCacheFolder = join(OUTPUTS_FOLDER, "serve-from-cache");
    expect(
      canServeFromCache(
        { cache: lCacheFolder },
        { SHA1: "dummy-sha", changes: [] }
      )
    ).to.equal(false);
  });

  it("returns false when the base SHA differs", () => {
    const lCacheFolder = join(OUTPUTS_FOLDER, "serve-from-cache-sha-differs");
    writeCache(lCacheFolder, lMinimalCruiseResult);
    expect(
      canServeFromCache(
        { args: "src test tools", cache: lCacheFolder },
        {
          SHA1: "another-sha",
          changes: [],
        }
      )
    ).to.equal(false);
  });

  it("returns false when a file was added", () => {
    const lCacheFolder = join(OUTPUTS_FOLDER, "serve-from-cache-file-added");
    writeCache(lCacheFolder, lMinimalCruiseResult);
    expect(
      canServeFromCache(
        { args: "src test tools", cache: lCacheFolder },
        {
          SHA1: "dummy-sha",
          changes: [
            {
              changeType: "added",
              name: "some-new-file.aap",
              checksum: "dummy-checksum",
            },
          ],
        }
      )
    ).to.equal(false);
  });

  it("returns false when cache written & revision data equal & options incompatible", () => {
    const lCacheFolder = join(
      OUTPUTS_FOLDER,
      "serve-from-cache-options-incompatible"
    );
    /** @type {import("../../types/cruise-result.js").ICruiseResult} */

    writeCache(lCacheFolder, lMinimalCruiseResult);
    expect(
      canServeFromCache(
        { args: "src test tools configs", cache: lCacheFolder },
        { SHA1: "dummy-sha", changes: [] }
      )
    ).to.equal(false);
  });

  it("returns true when cache written & revision data equal & options compatible", () => {
    const lCacheFolder = join(OUTPUTS_FOLDER, "serve-from-cache-compatible");
    /** @type {import("../../types/cruise-result.js").ICruiseResult} */

    writeCache(lCacheFolder, lMinimalCruiseResult);
    expect(
      canServeFromCache(
        { args: "src test tools", cache: lCacheFolder },
        { SHA1: "dummy-sha", changes: [] }
      )
    ).to.equal(true);
  });
});
