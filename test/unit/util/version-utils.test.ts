import { describe, it, expect } from "vitest"
import { VersionUtils } from "../../../src/util/VersionUtils"

describe("VersionUtils", () => {
    describe("isGreaterOrEqual", () => {
        it("should return false when comparing invalid versions", () => {
            expect(VersionUtils.isGreaterOrEqual("", "")).toBe(false)
            expect(VersionUtils.isGreaterOrEqual(undefined, "0.0.1")).toBe(false)
        })

        it("should return false when targetVersion is larger", () => {
            expect(VersionUtils.isGreaterOrEqual("1.2.3", "1.2.4")).toBe(false)
            expect(VersionUtils.isGreaterOrEqual("1.2.3", "1.4.3")).toBe(false)
            expect(VersionUtils.isGreaterOrEqual("1.2.3", "2.2.3")).toBe(false)
            expect(VersionUtils.isGreaterOrEqual("1.2", "1.3")).toBe(false)
            expect(VersionUtils.isGreaterOrEqual("1.2", "1.3.1")).toBe(false)
            expect(VersionUtils.isGreaterOrEqual("1.2.3", "1.3")).toBe(false)
            expect(VersionUtils.isGreaterOrEqual("1", "2")).toBe(false)
            expect(
                VersionUtils.isGreaterOrEqual(
                    "2.00.040.00.20190729.1",
                    "2.00.076.00.1705400033",
                ),
            ).toBe(false)
            expect(
                VersionUtils.isGreaterOrEqual(
                    "4.00.000.00.1732616693",
                    "4.00.000.00.1739875052",
                ),
            ).toBe(false)
        })

        it("should return true when targetVersion is smaller", () => {
            expect(VersionUtils.isGreaterOrEqual("1.2.3", "1.2.2")).toBe(true)
            expect(VersionUtils.isGreaterOrEqual("1.2.3", "1.1.3")).toBe(true)
            expect(VersionUtils.isGreaterOrEqual("1.2.3", "1.1.5")).toBe(true)
            expect(VersionUtils.isGreaterOrEqual("1.2.3", "0.2.3")).toBe(true)
            expect(VersionUtils.isGreaterOrEqual("1.2", "1.2")).toBe(true)
            expect(VersionUtils.isGreaterOrEqual("1.3", "1.2.3")).toBe(true)
            expect(VersionUtils.isGreaterOrEqual("1.2.3", "1.2")).toBe(true)
            expect(VersionUtils.isGreaterOrEqual("1", "1")).toBe(true)
            expect(
                VersionUtils.isGreaterOrEqual(
                    "2.00.076.00.1705400033",
                    "2.00.040.00.20190729.1",
                ),
            ).toBe(true)
            expect(
                VersionUtils.isGreaterOrEqual(
                    "4.00.000.00.1739875052",
                    "4.00.000.00.1732616693",
                ),
            ).toBe(true)
        })
    })
}) 