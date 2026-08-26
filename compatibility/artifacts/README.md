# Raw compatibility artifacts

`npm run compatibility:record` writes unnormalized captures to `raw/`. The
directory is intentionally ignored because raw traces contain deployment-local
tokens and are retained by CI as artifacts. Reviewed normalized fixtures are
committed under `compatibility/fixtures/`.
