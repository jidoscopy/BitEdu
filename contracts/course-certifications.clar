;; BitEdu Course Certifications Contract
;; Manages decentralized course completion certificates on Stacks

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u100))
(define-constant ERR_INVALID_COURSE (err u101))
(define-constant ERR_ALREADY_CERTIFIED (err u102))
(define-constant ERR_INVALID_GRADE (err u103))
(define-constant ERR_COURSE_NOT_FOUND (err u104))

;; Data Variables
(define-data-var next-cert-id uint u1)

;; Maps
(define-map courses 
  { course-id: uint }
  {
    title: (string-ascii 100),
    description: (string-ascii 500),
    instructor: principal,
    created-at: uint,
    is-active: bool,
    min-score: uint
  }
)

(define-map certifications
  { cert-id: uint }
  {
    student: principal,
    course-id: uint,
    completion-date: uint,
    final-score: uint,
    ipfs-hash: (string-ascii 100),
    is-verified: bool
  }
)

(define-map student-course-progress
  { student: principal, course-id: uint }
  {
    enrolled-at: uint,
    progress-percentage: uint,
    last-activity: uint,
    assignments-completed: (list 20 uint)
  }
)

(define-map course-stats
  { course-id: uint }
  {
    total-enrolled: uint,
    total-completed: uint,
    average-score: uint
  }
)

;; Public Functions

;; Create a new course
(define-public (create-course (title (string-ascii 100)) (description (string-ascii 500)) (min-score uint))
  (let ((course-id (var-get next-cert-id)))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (asserts! (and (>= min-score u0) (<= min-score u100)) ERR_INVALID_GRADE)
    
    (map-set courses 
      { course-id: course-id }
      {
        title: title,
        description: description,
        instructor: tx-sender,
        created-at: block-height,
        is-active: true,
        min-score: min-score
      }
    )
    
    (map-set course-stats
      { course-id: course-id }
      {
        total-enrolled: u0,
        total-completed: u0,
        average-score: u0
      }
    )
    
    (var-set next-cert-id (+ course-id u1))
    (ok course-id)
  )
)

;; Enroll student in course
(define-public (enroll-in-course (course-id uint))
  (let ((course (unwrap! (map-get? courses { course-id: course-id }) ERR_COURSE_NOT_FOUND))
        (stats (unwrap! (map-get? course-stats { course-id: course-id }) ERR_COURSE_NOT_FOUND)))
    (asserts! (get is-active course) ERR_INVALID_COURSE)
    
    (map-set student-course-progress
      { student: tx-sender, course-id: course-id }
      {
        enrolled-at: block-height,
        progress-percentage: u0,
        last-activity: block-height,
        assignments-completed: (list)
      }
    )
    
    (map-set course-stats
      { course-id: course-id }
      (merge stats { total-enrolled: (+ (get total-enrolled stats) u1) })
    )
    
    (ok true)
  )
)

;; Update student progress
(define-public (update-progress (course-id uint) (progress uint) (completed-assignment uint))
  (let ((current-progress (map-get? student-course-progress { student: tx-sender, course-id: course-id })))
    (asserts! (is-some current-progress) ERR_NOT_AUTHORIZED)
    (asserts! (<= progress u100) ERR_INVALID_GRADE)
    
    (let ((existing-progress (unwrap-panic current-progress))
          (current-assignments (get assignments-completed existing-progress)))
      (map-set student-course-progress
        { student: tx-sender, course-id: course-id }
        (merge existing-progress {
          progress-percentage: progress,
          last-activity: block-height,
          assignments-completed: (unwrap! (as-max-len? (append current-assignments completed-assignment) u20) (err u999))
        })
      )
    )
    
    (ok true)
  )
)

;; Issue certificate upon course completion
(define-public (issue-certificate (student principal) (course-id uint) (final-score uint) (ipfs-hash (string-ascii 100)))
  (let ((course (unwrap! (map-get? courses { course-id: course-id }) ERR_COURSE_NOT_FOUND))
        (cert-id (var-get next-cert-id))
        (stats (unwrap! (map-get? course-stats { course-id: course-id }) ERR_COURSE_NOT_FOUND)))
    
    (asserts! (is-eq tx-sender (get instructor course)) ERR_NOT_AUTHORIZED)
    (asserts! (>= final-score (get min-score course)) ERR_INVALID_GRADE)
    (asserts! (is-none (get-student-certificate student course-id)) ERR_ALREADY_CERTIFIED)
    
    (map-set certifications
      { cert-id: cert-id }
      {
        student: student,
        course-id: course-id,
        completion-date: block-height,
        final-score: final-score,
        ipfs-hash: ipfs-hash,
        is-verified: true
      }
    )
    
    (let ((current-total (get total-completed stats))
          (current-avg (get average-score stats))
          (new-total (+ current-total u1))
          (new-avg (/ (+ (* current-avg current-total) final-score) new-total)))
      
      (map-set course-stats
        { course-id: course-id }
        (merge stats { 
          total-completed: new-total,
          average-score: new-avg
        })
      )
    )
    
    (var-set next-cert-id (+ cert-id u1))
    (ok cert-id)
  )
)

;; Read-only functions

;; Get course information
(define-read-only (get-course (course-id uint))
  (map-get? courses { course-id: course-id })
)

;; Get student's certificate for a course
(define-read-only (get-student-certificate (student principal) (course-id uint))
  (let ((cert-id u1)) ;; Simplified implementation - would need to iterate through cert IDs
    (map-get? certifications { cert-id: cert-id })
  )
)

;; Get student progress
(define-read-only (get-student-progress (student principal) (course-id uint))
  (map-get? student-course-progress { student: student, course-id: course-id })
)

;; Get course statistics
(define-read-only (get-course-stats (course-id uint))
  (map-get? course-stats { course-id: course-id })
)

;; Get certificate by ID
(define-read-only (get-certificate (cert-id uint))
  (map-get? certifications { cert-id: cert-id })
)

;; Private functions
(define-private (is-student-cert-for-course (entry { key: { cert-id: uint }, value: { student: principal, course-id: uint, completion-date: uint, final-score: uint, ipfs-hash: (string-ascii 100), is-verified: bool } }))
  (and 
    (is-eq (get student (get value entry)) tx-sender)
    (is-eq (get course-id (get value entry)) (var-get next-cert-id))
  )
)

;; Helper function to convert map to list (placeholder for actual implementation)
(define-private (map-to-list)
  (list)
)