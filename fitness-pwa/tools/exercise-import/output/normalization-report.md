# Exercise Normalization Report

No Supabase data was changed. No SQL was generated.

## Counts

- Preview records read: 80
- Canonical exercises: 78
- Aliases: 14
- Needs manual review: 13

## Alias Groups

- Barbell Incline Bench Press
  - Barbell Incline Bench Press - Medium Grip

- Bench Press
  - Barbell Bench Press - Medium Grip

- Biceps Curl
  - Barbell Curl

- Crunch
  - Crunches

- Dips
  - Dips - Chest Version
  - Dips - Triceps Version

- Lat Pulldown
  - Wide-Grip Lat Pulldown

- Lateral Raise
  - Side Lateral Raise

- Pull Up
  - Pullups

- Push Up
  - Pushups

- Seated Cable Row
  - Seated Cable Rows

- Sit Up
  - 3/4 Sit-Up

- Squat
  - Barbell Full Squat
  - Barbell Squat

## Needs Manual Review

- Bench Press <> Close-Grip Barbell Bench Press
  - Reason: bench press family needs review (0.50)
  - Left examples: Barbell Bench Press - Medium Grip
  - Right examples: Close-Grip Barbell Bench Press

- Bench Press <> Dumbbell Bench Press
  - Reason: high token overlap (1.00)
  - Left examples: Barbell Bench Press - Medium Grip
  - Right examples: Dumbbell Bench Press

- Bench Press <> Barbell Incline Bench Press
  - Reason: bench press family needs review (0.67)
  - Left examples: Barbell Bench Press - Medium Grip
  - Right examples: Barbell Incline Bench Press - Medium Grip

- Bent Over Barbell Row <> Bent Over Two-Dumbbell Row
  - Reason: high token overlap (0.75)
  - Left examples: Bent Over Barbell Row
  - Right examples: Bent Over Two-Dumbbell Row

- Bodyweight Squat <> Goblet Squat
  - Reason: same progression group with partial overlap (0.50)
  - Left examples: Bodyweight Squat
  - Right examples: Goblet Squat

- Bodyweight Squat <> Squat
  - Reason: high token overlap (1.00)
  - Left examples: Bodyweight Squat
  - Right examples: Barbell Full Squat, Barbell Squat

- Cable Crunch <> Crunch
  - Reason: high token overlap (1.00)
  - Left examples: Cable Crunch
  - Right examples: Crunches

- Close-Grip Barbell Bench Press <> Dumbbell Bench Press
  - Reason: bench press family needs review (0.50)
  - Left examples: Close-Grip Barbell Bench Press
  - Right examples: Dumbbell Bench Press

- Close-Grip Barbell Bench Press <> Barbell Incline Bench Press
  - Reason: bench press family needs review (0.40)
  - Left examples: Close-Grip Barbell Bench Press
  - Right examples: Barbell Incline Bench Press - Medium Grip

- Dips <> Bench Dips
  - Reason: same progression group with partial overlap (0.50)
  - Left examples: Dips - Triceps Version, Dips - Chest Version
  - Right examples: Bench Dips

- Dumbbell Bench Press <> Barbell Incline Bench Press
  - Reason: bench press family needs review (0.67)
  - Left examples: Dumbbell Bench Press
  - Right examples: Barbell Incline Bench Press - Medium Grip

- Goblet Squat <> Squat
  - Reason: same progression group with partial overlap (0.50)
  - Left examples: Goblet Squat
  - Right examples: Barbell Full Squat, Barbell Squat

- Standing Calf Raises <> Barbell Seated Calf Raise
  - Reason: high token overlap (1.00)
  - Left examples: Standing Calf Raises
  - Right examples: Barbell Seated Calf Raise

## Notes

- High-confidence aliases use explicit rules or punctuation/plural normalization.
- Low-confidence near matches are listed for manual review instead of being merged.
- Canonical naming keeps future Gym, Calisthenics, and Street Workout support in mind by preserving equipment options, exercise types, training types, and progression groups.
