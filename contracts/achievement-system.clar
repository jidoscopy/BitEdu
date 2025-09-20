;; BitEdu Achievement System Contract
;; Manages badges, achievements, and gamification for the learning platform

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u300))
(define-constant ERR_INVALID_ACHIEVEMENT (err u301))
(define-constant ERR_ALREADY_EARNED (err u302))
(define-constant ERR_REQUIREMENTS_NOT_MET (err u303))

;; Data Variables
(define-data-var next-achievement-id uint u1)
(define-data-var next-badge-id uint u1)

;; Achievement Types
(define-constant COMPLETION_BADGE u1)
(define-constant STREAK_BADGE u2)
(define-constant EXCELLENCE_BADGE u3)
(define-constant COMMUNITY_BADGE u4)
(define-constant MILESTONE_BADGE u5)

;; Maps
(define-map achievements
  { achievement-id: uint }
  {
    title: (string-ascii 100),
    description: (string-ascii 300),
    badge-type: uint,
    requirements: (string-ascii 200),
    points-value: uint,
    rarity-level: uint,
    created-at: uint,
    is-active: bool
  }
)

(define-map student-achievements
  { student: principal, achievement-id: uint }
  {
    earned-at: uint,
    verification-hash: (string-ascii 100),
    is-verified: bool
  }
)

(define-map student-points
  { student: principal }
  {
    total-points: uint,
    level: uint,
    streak-days: uint,
    last-activity: uint,
    badges-earned: uint
  }
)

(define-map leaderboard
  { level: uint }
  {
    top-students: (list 10 principal),
    updated-at: uint
  }
)

;; Public Functions

;; Create new achievement
(define-public (create-achievement
  (title (string-ascii 100))
  (description (string-ascii 300))
  (badge-type uint)
  (requirements (string-ascii 200))
  (points-value uint)
  (rarity-level uint))

  (let ((achievement-id (var-get next-achievement-id))
        (validated-title (unwrap-panic (as-max-len? title u100)))
        (validated-description (unwrap-panic (as-max-len? description u300)))
        (safe-requirements (if (> (len requirements) u200)
                           (unwrap-panic (as-max-len? "Requirements too long" u200))
                           requirements))
        (validated-points (if (> points-value u1000000) u1000000 points-value)))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (asserts! (and (>= badge-type u1) (<= badge-type u5)) ERR_INVALID_ACHIEVEMENT)
    (asserts! (and (>= rarity-level u1) (<= rarity-level u5)) ERR_INVALID_ACHIEVEMENT)
    (asserts! (> (len validated-title) u0) ERR_INVALID_ACHIEVEMENT)
    (asserts! (> (len validated-description) u0) ERR_INVALID_ACHIEVEMENT)

    (map-set achievements
      { achievement-id: achievement-id }
      {
        title: validated-title,
        description: validated-description,
        badge-type: badge-type,
        requirements: safe-requirements,
        points-value: validated-points,
        rarity-level: rarity-level,
        created-at: block-height,
        is-active: true
      }
    )

    (var-set next-achievement-id (+ achievement-id u1))
    (ok achievement-id)
  )
)

;; Award achievement to student
(define-public (award-achievement
  (student principal)
  (achievement-id uint)
  (verification-hash (string-ascii 100)))

  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (asserts! (> (len verification-hash) u0) ERR_INVALID_ACHIEVEMENT)

    (let ((achievement (unwrap! (map-get? achievements { achievement-id: achievement-id }) ERR_INVALID_ACHIEVEMENT)))
      (asserts! (get is-active achievement) ERR_INVALID_ACHIEVEMENT)
      (asserts! (is-none (map-get? student-achievements { student: student, achievement-id: achievement-id })) ERR_ALREADY_EARNED)

      ;; Record achievement
      (map-set student-achievements
        { student: student, achievement-id: achievement-id }
        {
          earned-at: block-height,
          verification-hash: verification-hash,
          is-verified: true
        }
      )

      ;; Update student points and level
      (let ((student-points-data (default-to
              { total-points: u0, level: u1, streak-days: u0, last-activity: u0, badges-earned: u0 }
              (map-get? student-points { student: student })))
            (achievement-points (get points-value achievement)))

        (let ((new-points (+ (get total-points student-points-data) achievement-points))
              (new-badges (+ (get badges-earned student-points-data) u1))
              (new-level (calculate-level new-points)))

          (map-set student-points
            { student: student }
            (merge student-points-data {
              total-points: new-points,
              level: new-level,
              badges-earned: new-badges,
              last-activity: block-height
            })
          )
        )
      )

      (ok true)
    )
  )
)

;; Update daily streak
(define-public (update-daily-streak)
  (let ((current-data (default-to 
          { total-points: u0, level: u1, streak-days: u0, last-activity: u0, badges-earned: u0 }
          (map-get? student-points { student: tx-sender })))
        (last-activity (get last-activity current-data))
        (current-block block-height))
    
    (let ((days-since-last (if (> current-block last-activity) 
                            (/ (- current-block last-activity) u144) ;; Assuming ~144 blocks per day
                            u0)))
      (if (is-eq days-since-last u1)
        ;; Consecutive day, increment streak
        (map-set student-points
          { student: tx-sender }
          (merge current-data {
            streak-days: (+ (get streak-days current-data) u1),
            last-activity: current-block
          })
        )
        ;; Reset streak if more than 1 day gap
        (if (> days-since-last u1)
          (map-set student-points
            { student: tx-sender }
            (merge current-data {
              streak-days: u1,
              last-activity: current-block
            })
          )
          ;; Same day, just update activity
          (map-set student-points
            { student: tx-sender }
            (merge current-data { last-activity: current-block })
          )
        )
      )
    )
    (ok true)
  )
)

;; Read-only Functions

;; Get achievement details
(define-read-only (get-achievement (achievement-id uint))
  (map-get? achievements { achievement-id: achievement-id })
)

;; Get student's achievements
(define-read-only (has-student-earned-achievement (student principal) (achievement-id uint))
  (is-some (map-get? student-achievements { student: student, achievement-id: achievement-id }))
)

;; Get student points and level
(define-read-only (get-student-points (student principal))
  (map-get? student-points { student: student })
)

;; Get student's current level
(define-read-only (get-student-level (student principal))
  (let ((points-data (map-get? student-points { student: student })))
    (match points-data
      some-data (get level some-data)
      u1
    )
  )
)

;; Get leaderboard for specific level
(define-read-only (get-leaderboard (level uint))
  (map-get? leaderboard { level: level })
)

;; Private Functions

;; Calculate level based on points
(define-private (calculate-level (points uint))
  (if (>= points u10000) 
      u10
      (if (>= points u5000) 
          u9
          (if (>= points u2500) 
              u8
              (if (>= points u1500) 
                  u7
                  (if (>= points u1000) 
                      u6
                      (if (>= points u600) 
                          u5
                          (if (>= points u300) 
                              u4
                              (if (>= points u150) 
                                  u3
                                  (if (>= points u50) 
                                      u2
                                      u1))))))))))

;; Check if student meets achievement requirements
(define-private (meets-requirements (student principal) (achievement-id uint))
  (let ((achievement (unwrap! (map-get? achievements { achievement-id: achievement-id }) false))
        (student-data (map-get? student-points { student: student })))
    (match student-data
      some-data (let ((badge-type (get badge-type achievement)))
                  (if (is-eq badge-type COMPLETION_BADGE) true
                      (if (is-eq badge-type STREAK_BADGE) (>= (get streak-days some-data) u7)
                          (if (is-eq badge-type EXCELLENCE_BADGE) (>= (get total-points some-data) u500)
                              true))))
      false
    )
  )
)