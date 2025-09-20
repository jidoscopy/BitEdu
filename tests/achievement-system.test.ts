import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const student1 = accounts.get("wallet_1")!;

describe("Achievement System Contract", () => {
  describe("Achievement Creation", () => {
    it("should create new achievements", () => {
      const { result } = simnet.callPublicFn(
        "achievement-system",
        "create-achievement",
        [
          Cl.stringAscii("First Course Completed"),
          Cl.stringAscii("Complete your first Bitcoin course"),
          Cl.uint(1), // COMPLETION_BADGE
          Cl.stringAscii("Complete any course with score >= 70%"),
          Cl.uint(100), // Points value
          Cl.uint(2) // Rarity level
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("should reject invalid badge types", () => {
      const { result } = simnet.callPublicFn(
        "achievement-system",
        "create-achievement",
        [
          Cl.stringAscii("Invalid Badge"),
          Cl.stringAscii("Badge with invalid type"),
          Cl.uint(10), // Invalid badge type
          Cl.stringAscii("Invalid requirements"),
          Cl.uint(50),
          Cl.uint(1)
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(301)); // ERR_INVALID_ACHIEVEMENT
    });
  });

  describe("Achievement Awards", () => {
    beforeEach(() => {
      // Create test achievement
      simnet.callPublicFn(
        "achievement-system",
        "create-achievement",
        [
          Cl.stringAscii("Test Achievement"),
          Cl.stringAscii("Achievement for testing"),
          Cl.uint(1),
          Cl.stringAscii("Test requirements"),
          Cl.uint(200),
          Cl.uint(3)
        ],
        deployer
      );
    });

    it("should award achievements to students", () => {
      const { result } = simnet.callPublicFn(
        "achievement-system",
        "award-achievement",
        [
          Cl.principal(student1),
          Cl.uint(1),
          Cl.stringAscii("verification-hash-123")
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should prevent duplicate achievement awards", () => {
      // Award first time
      simnet.callPublicFn(
        "achievement-system",
        "award-achievement",
        [
          Cl.principal(student1),
          Cl.uint(1),
          Cl.stringAscii("verification-hash-123")
        ],
        deployer
      );

      // Try to award again
      const { result } = simnet.callPublicFn(
        "achievement-system",
        "award-achievement",
        [
          Cl.principal(student1),
          Cl.uint(1),
          Cl.stringAscii("verification-hash-456")
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(302)); // ERR_ALREADY_EARNED
    });

    it("should update student points when awarding achievements", () => {
      // Award achievement
      simnet.callPublicFn(
        "achievement-system",
        "award-achievement",
        [
          Cl.principal(student1),
          Cl.uint(1),
          Cl.stringAscii("hash-123")
        ],
        deployer
      );

      // Check student points
      const { result } = simnet.callReadOnlyFn(
        "achievement-system",
        "get-student-points",
        [Cl.principal(student1)],
        deployer
      );

      expect(result).toBeSome();
    });
  });

  describe("Daily Streak Tracking", () => {
    it("should update daily streaks", () => {
      const { result } = simnet.callPublicFn(
        "achievement-system",
        "update-daily-streak",
        [],
        student1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should track consecutive days", () => {
      // Update streak first time
      simnet.callPublicFn(
        "achievement-system",
        "update-daily-streak",
        [],
        student1
      );

      // Advance blocks (simulate next day)
      simnet.mineEmptyBlocks(144); // Simulate 1 day

      // Update streak second time
      const { result } = simnet.callPublicFn(
        "achievement-system",
        "update-daily-streak",
        [],
        student1
      );

      expect(result).toBeOk(Cl.bool(true));

      // Check streak count
      const pointsResult = simnet.callReadOnlyFn(
        "achievement-system",
        "get-student-points",
        [Cl.principal(student1)],
        deployer
      );

      expect(pointsResult).toBeSome();
    });
  });

  describe("Student Level Calculation", () => {
    it("should calculate correct student level", () => {
      // Award multiple achievements to accumulate points
      simnet.callPublicFn(
        "achievement-system",
        "create-achievement",
        [
          Cl.stringAscii("High Points Achievement"),
          Cl.stringAscii("High value achievement"),
          Cl.uint(1),
          Cl.stringAscii("Test requirements"),
          Cl.uint(1500), // High points
          Cl.uint(4)
        ],
        deployer
      );

      simnet.callPublicFn(
        "achievement-system",
        "award-achievement",
        [
          Cl.principal(student1),
          Cl.uint(1),
          Cl.stringAscii("hash-high-points")
        ],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "achievement-system",
        "get-student-level",
        [Cl.principal(student1)],
        deployer
      );

      expect(result).toBe(Cl.uint(2)); // Should be level 2 with 1500 points
    });
  });
});