# Exercise Import Preview

Source: yuhonas/free-exercise-db `dist/exercises.json`

No Supabase data was changed. This is a review artifact only.

## Counts

- Source records: 873
- Preview selected: 80
- Skipped/deferred: 793

## Selected By App Category

- Legs: 15
- Core: 14
- Back: 12
- Shoulders: 11
- Arms: 10
- Cardio: 10
- Chest: 8

## Selected By Training Type

- gym: 54
- calisthenics: 11
- cardio: 10
- street_workout: 5

## Selected By Exercise Type

- gym: 54
- bodyweight: 15
- distance: 10
- hold: 1

## Top Skip Reasons

- outside curated first batch: 597
- unclear, overly niche, or not suitable for first batch: 96
- category deferred from first batch: 95
- missing instructions: 5

## Next Review Steps

1. Review `exercises-preview.json` for category and equipment quality.
2. Review `skipped-exercises.json` for useful exercises that were deferred.
3. Adjust mapping rules before generating SQL.
4. Keep images as source paths only until an explicit storage/import phase.
