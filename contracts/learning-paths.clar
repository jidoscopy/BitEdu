;; BitEdu Learning Paths Contract
;; Manages AI-personalized learning paths and adaptive content delivery

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u200))
(define-constant ERR_INVALID_PATH (err u201))
(define-constant ERR_INVALID_LEVEL (err u202))
(define-constant ERR_PATH_NOT_FOUND (err u203))

;; Data Variables
(define-data-var next-path-id uint u1)

;; Learning difficulty levels
(define-constant BEGINNER u1)
(define-constant INTERMEDIATE u2)
(define-constant ADVANCED u3)
(define-constant EXPERT u4)

;; Maps
(define-map learning-paths
  { path-id: uint }
  {
    title: (string-ascii 100),
    description: (string-ascii 500),
    difficulty-level: uint,
    estimated-duration: uint,
    prerequisites: (list 10 uint),
    course-sequence: (list 20 uint),
    created-by: principal,
    is-active: bool
  }
)

(define-map student-path-assignments
  { student: principal }
  {
    current-path-id: uint,
    assigned-at: uint,
    ai-confidence-score: uint,
    learning-style: (string-ascii 50),
    preferred-pace: uint,
    knowledge-gaps: (list 10 (string-ascii 50))
  }
)

(define-map path-analytics
  { path-id: uint }
  {
    total-students: uint,
    completion-rate: uint,
    average-time: uint,
    success-rate: uint,
    difficulty-rating: uint
  }
)

(define-map student-learning-data
  { student: principal }
  {
    learning-style: (string-ascii 50),
    engagement-score: uint,
    preferred-content-type: (string-ascii 30),
    study-time-preference: uint,
    weak-topics: (list 10 (string-ascii 50)),
    strong-topics: (list 10 (string-ascii 50)),
    last-assessment: uint
  }
)

;; Public Functions

;; Create a new learning path
(define-public (create-learning-path
  (title (string-ascii 100))
  (description (string-ascii 500))
  (difficulty-level uint)
  (estimated-duration uint)
  (prerequisites (list 10 uint))
  (course-sequence (list 20 uint)))

  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (asserts! (and (>= difficulty-level BEGINNER) (<= difficulty-level EXPERT)) ERR_INVALID_LEVEL)
    (asserts! (> (len title) u0) ERR_INVALID_LEVEL)
    (asserts! (> (len description) u0) ERR_INVALID_LEVEL)
    (asserts! (> estimated-duration u0) ERR_INVALID_LEVEL)

    (let ((path-id (var-get next-path-id)))
      (map-set learning-paths
        { path-id: path-id }
        {
          title: title,
          description: description,
          difficulty-level: difficulty-level,
          estimated-duration: estimated-duration,
          prerequisites: prerequisites,
          course-sequence: course-sequence,
          created-by: tx-sender,
          is-active: true
        }
      )

      (map-set path-analytics
        { path-id: path-id }
        {
          total-students: u0,
          completion-rate: u0,
          average-time: u0,
          success-rate: u0,
          difficulty-rating: difficulty-level
        }
      )

      (var-set next-path-id (+ path-id u1))
      (ok path-id)
    )
  )
)

;; AI assigns personalized learning path to student
(define-public (assign-personalized-path 
  (student principal)
  (path-id uint)
  (ai-confidence uint)
  (learning-style (string-ascii 50))
  (preferred-pace uint)
  (knowledge-gaps (list 10 (string-ascii 50))))
  
  (let ((path (unwrap! (map-get? learning-paths { path-id: path-id }) ERR_PATH_NOT_FOUND))
        (analytics (unwrap! (map-get? path-analytics { path-id: path-id }) ERR_PATH_NOT_FOUND)))
    
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (asserts! (get is-active path) ERR_INVALID_PATH)
    
    (map-set student-path-assignments
      { student: student }
      {
        current-path-id: path-id,
        assigned-at: block-height,
        ai-confidence-score: ai-confidence,
        learning-style: learning-style,
        preferred-pace: preferred-pace,
        knowledge-gaps: knowledge-gaps
      }
    )
    
    (map-set path-analytics
      { path-id: path-id }
      (merge analytics { total-students: (+ (get total-students analytics) u1) })
    )
    
    (ok true)
  )
)

;; Update student learning profile
(define-public (update-learning-profile (learning-style (string-ascii 50)) (engagement-score uint) (content-type (string-ascii 30)) (study-time uint) (weak-topics (list 10 (string-ascii 50))) (strong-topics (list 10 (string-ascii 50))))
  (begin
    (map-set student-learning-data
      { student: tx-sender }
      {
        learning-style: learning-style,
        engagement-score: engagement-score,
        preferred-content-type: content-type,
        study-time-preference: study-time,
        weak-topics: weak-topics,
        strong-topics: strong-topics,
        last-assessment: block-height
      }
    )
    (ok true)
  )
)

;; Complete learning path
(define-public (complete-learning-path (path-id uint) (completion-time uint))
  (let ((assignment (unwrap! (map-get? student-path-assignments { student: tx-sender }) ERR_NOT_AUTHORIZED))
        (analytics (unwrap! (map-get? path-analytics { path-id: path-id }) ERR_PATH_NOT_FOUND)))
    
    (asserts! (is-eq (get current-path-id assignment) path-id) ERR_INVALID_PATH)
    
    (let ((current-rate (get completion-rate analytics))
          (current-total (get total-students analytics))
          (current-avg-time (get average-time analytics))
          (new-completion-rate (+ current-rate u1))
          (new-avg-time (if (is-eq current-rate u0) 
                         completion-time 
                         (/ (+ (* current-avg-time current-rate) completion-time) (+ current-rate u1)))))
      
      (map-set path-analytics
        { path-id: path-id }
        (merge analytics {
          completion-rate: new-completion-rate,
          average-time: new-avg-time
        })
      )
    )
    
    (ok true)
  )
)

;; Read-only functions

;; Get learning path details
(define-read-only (get-learning-path (path-id uint))
  (map-get? learning-paths { path-id: path-id })
)

;; Get student's current path assignment
(define-read-only (get-student-assignment (student principal))
  (map-get? student-path-assignments { student: student })
)

;; Get student learning profile
(define-read-only (get-learning-profile (student principal))
  (map-get? student-learning-data { student: student })
)

;; Get path analytics
(define-read-only (get-path-analytics (path-id uint))
  (map-get? path-analytics { path-id: path-id })
)

;; Get recommended difficulty level based on student data
(define-read-only (get-recommended-difficulty (student principal))
  (let ((profile (map-get? student-learning-data { student: student })))
    (match profile
      some-profile (let ((engagement (get engagement-score some-profile)))
                     (if (>= engagement u80) ADVANCED
                         (if (>= engagement u60) INTERMEDIATE
                             BEGINNER)))
      BEGINNER
    )
  )
)