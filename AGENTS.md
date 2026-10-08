# Portfolio workflow

- Preserve this Site's existing identity and all verified professional content.
- Make a separate, descriptive Git commit for each meaningful feature, implementation milestone, or bug fix. The user explicitly requested incremental commits rather than one final commit.
- Validate the changed behavior or source before committing. Do not commit broken intermediate files merely to increase commit count.
- Once the user supplies a GitHub repository, push completed commits there as part of each future update. Preserve the Sites publishing workflow as well.
- Never commit credentials, source write tokens, temporary transfer helpers, or private employer code/data.
- Keep conceptual demonstrations clearly distinguished from actual production systems.
- Retain the direct résumé and text-based field guide alongside the explorable portfolio world.

- Push each completed milestone to `Siddhant-Shankar/living-city-portfolio` before starting the next feature. Use the connected GitHub API where authenticated CLI access is unavailable. Preserve concurrent remote changes.
- Exclude `dist/resume.pdf` from public GitHub snapshots until the user explicitly approves publishing that PDF. Preserve its existing owner-private Sites copy.
- Report source validation separately from browser QA; do not claim browser testing when it was unavailable.
