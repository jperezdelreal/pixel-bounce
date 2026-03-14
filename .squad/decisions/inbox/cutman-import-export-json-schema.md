# Decision: JSON Schema Versioning for Level Import/Export

**Date:** 2025-01-20  
**Author:** Cut Man  
**Status:** Implemented  
**Related:** Issue #23, PR #31

## Context
Implemented level import/export feature for the editor. Needed a stable JSON format that can evolve over time as the editor gains features (moving platforms, custom colors, level metadata, etc.).

## Decision
Added `version: 1` field to exported JSON schema:

```json
{
  "version": 1,
  "platforms": [...],
  "stars": [...],
  "spawn": { "x": 200, "y": 500 },
  "metadata": {
    "author": "Player",
    "created": "2025-01-20T12:34:56.789Z"
  }
}
```

## Rationale
- **Future-proof**: Version field enables schema migrations if format changes
- **Backwards compatibility**: Future versions can detect v1 files and upgrade them
- **Validation**: Importers can reject unsupported versions with clear error messages
- **Metadata**: Author and timestamp track level provenance without affecting gameplay

## Alternatives Considered
- **No versioning**: Rejected - breaks if format changes (e.g., adding moving platform direction)
- **Inline version in filename**: Rejected - users rename files, loses reliability
- **Separate metadata file**: Rejected - two files harder to share, more error-prone

## Implementation Notes
- Current validator accepts any version (no version checks yet)
- Future enhancement: Check `data.version` and upgrade older formats
- Metadata is optional - missing fields don't fail import
- Platform/star validation uses fallback values (p.x || 0) for robustness

## Team Impact
- **Scribe:** Document this versioning scheme in codebase README when editor ships
- **Guts Man:** If level validation evolves, respect version field for compatibility
- **Proto Man:** When reviewing PRs, ensure new level features update schema version if format changes
