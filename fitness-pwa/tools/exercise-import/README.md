# Exercise Import Preview Tool

This tool prepares review-only import previews from `yuhonas/free-exercise-db`.

It does not write to Supabase, does not generate SQL, and does not download or commit the source dataset.

## Download The Source JSON

Download the combined dataset from:

```text
https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json
```

Save it somewhere local, for example:

```text
tools/exercise-import/source/exercises.json
```

Do not commit the downloaded dataset unless a later phase explicitly decides to vendor it.

## Run

From the project root:

```powershell
npm.cmd run preview:exercises -- tools/exercise-import/source/exercises.json
```

Or run the script directly:

```powershell
node tools/exercise-import/generate-exercise-preview.mjs tools/exercise-import/source/exercises.json
```

## Outputs

The script writes:

```text
tools/exercise-import/output/exercises-preview.json
tools/exercise-import/output/skipped-exercises.json
tools/exercise-import/output/import-summary.md
```

`exercises-preview.json` contains a curated first batch normalized toward the app model. It includes mapped category, muscles, equipment, difficulty, instructions, source image paths, training type, exercise type, default unit, and capability flags.

`skipped-exercises.json` lists records skipped or deferred from the first batch with reasons.

`import-summary.md` summarizes counts by category, training type, exercise type, and skip reason.

## Notes

The first batch intentionally favors gym essentials, bodyweight/calisthenics basics, and cardio basics. It skips or defers unclear, duplicate, overly niche, recovery, and highly specialized records.

Images are kept as source paths only. No image files are imported into Supabase Storage in this phase.
