import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const student1 = accounts.get("wallet_1")!;
const student2 = accounts.get("wallet_2")!;

describe("Course Certifications Contract", () => {
  beforeEach(() => {
    // Reset contract state before each test
  });

  describe("Course Creation", () => {
    it("should allow deployer to create a course", () => {
      const { result } = simnet.callPublicFn(
        "course-certifications",
        "create-course",
        [
          Cl.stringAscii("Bitcoin Fundamentals"),
          Cl.stringAscii("Learn the basics of Bitcoin technology"),
          Cl.uint(70)
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("should prevent non-deployer from creating courses", () => {
      const { result } = simnet.callPublicFn(
        "course-certifications",
        "create-course",
        [
          Cl.stringAscii("Unauthorized Course"),
          Cl.stringAscii("This should fail"),
          Cl.uint(70)
        ],
        student1
      );

      expect(result).toBeErr(Cl.uint(100)); // ERR_NOT_AUTHORIZED
    });

    it("should reject invalid minimum scores", () => {
      const { result } = simnet.callPublicFn(
        "course-certifications",
        "create-course",
        [
          Cl.stringAscii("Invalid Course"),
          Cl.stringAscii("Course with invalid min score"),
          Cl.uint(150) // Invalid score > 100
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(103)); // ERR_INVALID_GRADE
    });
  });

  describe("Course Enrollment", () => {
    beforeEach(() => {
      // Create a test course
      simnet.callPublicFn(
        "course-certifications",
        "create-course",
        [
          Cl.stringAscii("Test Course"),
          Cl.stringAscii("A course for testing"),
          Cl.uint(70)
        ],
        deployer
      );
    });

    it("should allow students to enroll in courses", () => {
      const { result } = simnet.callPublicFn(
        "course-certifications",
        "enroll-in-course",
        [Cl.uint(1)],
        student1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should track student enrollment", () => {
      // Enroll student
      simnet.callPublicFn(
        "course-certifications",
        "enroll-in-course",
        [Cl.uint(1)],
        student1
      );

      // Check enrollment
      const { result } = simnet.callReadOnlyFn(
        "course-certifications",
        "get-student-progress",
        [Cl.principal(student1), Cl.uint(1)],
        deployer
      );

      expect(result).toBeSome();
    });
  });

  describe("Progress Tracking", () => {
    beforeEach(() => {
      // Create course and enroll student
      simnet.callPublicFn(
        "course-certifications",
        "create-course",
        [
          Cl.stringAscii("Progress Test"),
          Cl.stringAscii("Testing progress updates"),
          Cl.uint(70)
        ],
        deployer
      );

      simnet.callPublicFn(
        "course-certifications",
        "enroll-in-course",
        [Cl.uint(1)],
        student1
      );
    });

    it("should allow enrolled students to update progress", () => {
      const { result } = simnet.callPublicFn(
        "course-certifications",
        "update-progress",
        [Cl.uint(1), Cl.uint(50), Cl.uint(1)],
        student1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should prevent non-enrolled students from updating progress", () => {
      const { result } = simnet.callPublicFn(
        "course-certifications",
        "update-progress",
        [Cl.uint(1), Cl.uint(50), Cl.uint(1)],
        student2
      );

      expect(result).toBeErr(Cl.uint(100)); // ERR_NOT_AUTHORIZED
    });
  });

  describe("Certificate Issuance", () => {
    beforeEach(() => {
      // Setup course and student enrollment
      simnet.callPublicFn(
        "course-certifications",
        "create-course",
        [
          Cl.stringAscii("Certification Test"),
          Cl.stringAscii("Course for testing certificates"),
          Cl.uint(70)
        ],
        deployer
      );

      simnet.callPublicFn(
        "course-certifications",
        "enroll-in-course",
        [Cl.uint(1)],
        student1
      );
    });

    it("should allow instructor to issue certificates", () => {
      const { result } = simnet.callPublicFn(
        "course-certifications",
        "issue-certificate",
        [
          Cl.principal(student1),
          Cl.uint(1),
          Cl.uint(85),
          Cl.stringAscii("QmTest123...") // IPFS hash
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("should reject certificates with scores below minimum", () => {
      const { result } = simnet.callPublicFn(
        "course-certifications",
        "issue-certificate",
        [
          Cl.principal(student1),
          Cl.uint(1),
          Cl.uint(65), // Below 70% minimum
          Cl.stringAscii("QmTest123...")
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(103)); // ERR_INVALID_GRADE
    });

    it("should prevent duplicate certificates", () => {
      // Issue first certificate
      simnet.callPublicFn(
        "course-certifications",
        "issue-certificate",
        [
          Cl.principal(student1),
          Cl.uint(1),
          Cl.uint(85),
          Cl.stringAscii("QmTest123...")
        ],
        deployer
      );

      // Try to issue duplicate
      const { result } = simnet.callPublicFn(
        "course-certifications",
        "issue-certificate",
        [
          Cl.principal(student1),
          Cl.uint(1),
          Cl.uint(90),
          Cl.stringAscii("QmTest456...")
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(102)); // ERR_ALREADY_CERTIFIED
    });
  });

  describe("Data Retrieval", () => {
    beforeEach(() => {
      // Setup test data
      simnet.callPublicFn(
        "course-certifications",
        "create-course",
        [
          Cl.stringAscii("Data Test Course"),
          Cl.stringAscii("Testing data retrieval"),
          Cl.uint(75)
        ],
        deployer
      );
    });

    it("should retrieve course information", () => {
      const { result } = simnet.callReadOnlyFn(
        "course-certifications",
        "get-course",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeSome();
    });

    it("should return none for non-existent courses", () => {
      const { result } = simnet.callReadOnlyFn(
        "course-certifications",
        "get-course",
        [Cl.uint(999)],
        deployer
      );

      expect(result).toBeNone();
    });
  });
});