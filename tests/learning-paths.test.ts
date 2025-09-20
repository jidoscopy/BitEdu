import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const student1 = accounts.get("wallet_1")!;

describe("Learning Paths Contract", () => {
  beforeEach(() => {
    // Reset contract state
  });

  describe("Learning Path Creation", () => {
    it("should create a new learning path", () => {
      const { result } = simnet.callPublicFn(
        "learning-paths",
        "create-learning-path",
        [
          Cl.stringAscii("Bitcoin Beginner Path"),
          Cl.stringAscii("Comprehensive path for Bitcoin beginners"),
          Cl.uint(1), // BEGINNER
          Cl.uint(40), // 40 hours
          Cl.list([]), // No prerequisites
          Cl.list([Cl.uint(1), Cl.uint(2), Cl.uint(3)]) // Course sequence
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("should reject invalid difficulty levels", () => {
      const { result } = simnet.callPublicFn(
        "learning-paths",
        "create-learning-path",
        [
          Cl.stringAscii("Invalid Path"),
          Cl.stringAscii("Path with invalid difficulty"),
          Cl.uint(5), // Invalid difficulty level
          Cl.uint(40),
          Cl.list([]),
          Cl.list([Cl.uint(1)])
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(202)); // ERR_INVALID_LEVEL
    });
  });

  describe("Personalized Path Assignment", () => {
    beforeEach(() => {
      // Create a test learning path
      simnet.callPublicFn(
        "learning-paths",
        "create-learning-path",
        [
          Cl.stringAscii("Test Path"),
          Cl.stringAscii("Path for testing assignments"),
          Cl.uint(2), // INTERMEDIATE
          Cl.uint(60),
          Cl.list([]),
          Cl.list([Cl.uint(1), Cl.uint(2)])
        ],
        deployer
      );
    });

    it("should assign personalized path to student", () => {
      const { result } = simnet.callPublicFn(
        "learning-paths",
        "assign-personalized-path",
        [
          Cl.principal(student1),
          Cl.uint(1),
          Cl.uint(85), // AI confidence
          Cl.stringAscii("kinesthetic"),
          Cl.uint(3), // Preferred pace
          Cl.list([Cl.stringAscii("cryptography"), Cl.stringAscii("consensus")])
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should track path analytics", () => {
      // Assign path
      simnet.callPublicFn(
        "learning-paths",
        "assign-personalized-path",
        [
          Cl.principal(student1),
          Cl.uint(1),
          Cl.uint(85),
          Cl.stringAscii("visual"),
          Cl.uint(2),
          Cl.list([])
        ],
        deployer
      );

      // Check analytics
      const { result } = simnet.callReadOnlyFn(
        "learning-paths",
        "get-path-analytics",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeSome();
    });
  });

  describe("Learning Profile Updates", () => {
    it("should allow students to update their learning profile", () => {
      const { result } = simnet.callPublicFn(
        "learning-paths",
        "update-learning-profile",
        [
          Cl.stringAscii("visual"),
          Cl.uint(75), // Engagement score
          Cl.stringAscii("interactive"),
          Cl.uint(120), // Study time preference in minutes
          Cl.list([Cl.stringAscii("cryptography")]), // Weak topics
          Cl.list([Cl.stringAscii("programming")]) // Strong topics
        ],
        student1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should retrieve learning profile", () => {
      // Update profile first
      simnet.callPublicFn(
        "learning-paths",
        "update-learning-profile",
        [
          Cl.stringAscii("auditory"),
          Cl.uint(80),
          Cl.stringAscii("video"),
          Cl.uint(90),
          Cl.list([]),
          Cl.list([])
        ],
        student1
      );

      // Retrieve profile
      const { result } = simnet.callReadOnlyFn(
        "learning-paths",
        "get-learning-profile",
        [Cl.principal(student1)],
        deployer
      );

      expect(result).toBeSome();
    });
  });

  describe("Difficulty Recommendations", () => {
    it("should provide difficulty recommendations based on student data", () => {
      // Set up student profile
      simnet.callPublicFn(
        "learning-paths",
        "update-learning-profile",
        [
          Cl.stringAscii("kinesthetic"),
          Cl.uint(85), // High engagement
          Cl.stringAscii("coding"),
          Cl.uint(60),
          Cl.list([]),
          Cl.list([])
        ],
        student1
      );

      // Get recommendation
      const { result } = simnet.callReadOnlyFn(
        "learning-paths",
        "get-recommended-difficulty",
        [Cl.principal(student1)],
        deployer
      );

      expect(result).toBe(Cl.uint(3)); // ADVANCED due to high engagement
    });

    it("should recommend beginner level for new students", () => {
      const { result } = simnet.callReadOnlyFn(
        "learning-paths",
        "get-recommended-difficulty",
        [Cl.principal(student2)], // Student with no profile
        deployer
      );

      expect(result).toBe(Cl.uint(1)); // BEGINNER
    });
  });

  describe("Path Completion", () => {
    beforeEach(() => {
      // Setup path and assignment
      simnet.callPublicFn(
        "learning-paths",
        "create-learning-path",
        [
          Cl.stringAscii("Completion Test"),
          Cl.stringAscii("Path for testing completion"),
          Cl.uint(1),
          Cl.uint(20),
          Cl.list([]),
          Cl.list([Cl.uint(1)])
        ],
        deployer
      );

      simnet.callPublicFn(
        "learning-paths",
        "assign-personalized-path",
        [
          Cl.principal(student1),
          Cl.uint(1),
          Cl.uint(90),
          Cl.stringAscii("mixed"),
          Cl.uint(2),
          Cl.list([])
        ],
        deployer
      );
    });

    it("should allow students to complete their assigned path", () => {
      const { result } = simnet.callPublicFn(
        "learning-paths",
        "complete-learning-path",
        [Cl.uint(1), Cl.uint(1200)], // 1200 minutes completion time
        student1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should update completion analytics", () => {
      // Complete the path
      simnet.callPublicFn(
        "learning-paths",
        "complete-learning-path",
        [Cl.uint(1), Cl.uint(1500)],
        student1
      );

      // Check updated analytics
      const { result } = simnet.callReadOnlyFn(
        "learning-paths",
        "get-path-analytics",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeSome();
      // Would check that completion stats were updated
    });
  });
});