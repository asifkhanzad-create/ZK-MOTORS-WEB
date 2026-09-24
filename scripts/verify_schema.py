#!/usr/bin/env python3
"""
Verify that the Supabase schema and the TypeScript domain types still agree.

    python scripts/verify_schema.py

Why this exists
---------------
`supabase/migrations/0001_vehicles.sql` duplicates facts that already live in
`src/types/vehicle.ts`: the allowed body types, fuel types, transmission values
and statuses. Postgres cannot read TypeScript, so nothing enforces that the two
stay in step — and when they drift the failure is silent and confusing. Add
"Coupe" to `BodyType` in TS, forget the SQL `CHECK`, and every insert of a coupe
fails at the database with a constraint violation that mentions a column name
rather than the real cause.

This script parses both files and diffs them, so the drift shows up here instead
of in production. Same idea as `scripts/verify_theme.py`: a fact that is
duplicated across a boundary gets a check.

No third-party packages required. If `pglast` happens to be installed it will
additionally parse the SQL for syntax errors, but that check is optional — the
Supabase SQL editor already does it on paste.
"""

from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TYPES = ROOT / "src" / "types" / "vehicle.ts"
MIGRATION = ROOT / "supabase" / "migrations" / "0001_vehicles.sql"
ADMIN_SQL = ROOT / "supabase" / "migrations" / "0002_admin_access.sql"
SEED_STORAGE = ROOT / "supabase" / "seed-storage.sql"
ACTIONS = ROOT / "src" / "app" / "admin" / "vehicle-actions.ts"

# SQL column -> TypeScript union name. Only the columns that carry a CHECK.
CONSTRAINED = {
    "status": "VehicleStatus",
    "transmission": "Transmission",
    "fuel": "FuelType",
    "body_type": "BodyType",
}

# Columns that exist on the table but deliberately have no field on `Vehicle`:
# server-managed timestamps and the draft flag.
EXTRA_COLUMNS = {"created_at", "updated_at", "published"}

passed = 0
failed = 0


def check(ok: bool, label: str, detail: str = "") -> None:
    global passed, failed
    if ok:
        passed += 1
        print(f"  PASS  {label}" + (f"  ({detail})" if detail else ""))
    else:
        failed += 1
        print(f"  FAIL  {label}" + (f"  ({detail})" if detail else ""))


def to_snake(name: str) -> str:
    """imageAlt -> image_alt, bodyType -> body_type."""
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


def main() -> int:
    if not TYPES.exists():
        print(f"missing {TYPES}", file=sys.stderr)
        return 2
    if not MIGRATION.exists():
        print(f"missing {MIGRATION}", file=sys.stderr)
        return 2

    ts = TYPES.read_text(encoding="utf-8")
    sql = MIGRATION.read_text(encoding="utf-8")

    # ---- TypeScript unions -------------------------------------------------
    unions: dict[str, set[str]] = {}
    for name, body in re.findall(r"export type (\w+) =([^;]+);", ts):
        unions[name] = set(re.findall(r'"([^"]+)"', body))

    # ---- SQL CHECK lists ---------------------------------------------------
    checks: dict[str, set[str]] = {}
    for col, body in re.findall(
        r"(\w+)\s+text\s+not null[^,]*?check\s*\(\s*\1\s+in\s*\(([^)]+)\)", sql, re.S
    ):
        checks[col] = set(re.findall(r"'([^']+)'", body))

    print("\n== CHECK constraints match the TypeScript unions ==")
    for col, type_name in CONSTRAINED.items():
        sql_values = checks.get(col, set())
        ts_values = unions.get(type_name, set())
        if not sql_values:
            check(False, f"{col} has a CHECK in the migration", "none found")
            continue
        if not ts_values:
            check(False, f"{type_name} exists in vehicle.ts", "none found")
            continue
        # Set comparison, so ordering and formatting differences do not matter.
        detail = f"{len(sql_values)} values"
        if sql_values != ts_values:
            detail = (
                f"only in SQL: {sorted(sql_values - ts_values)}; "
                f"only in TS: {sorted(ts_values - sql_values)}"
            )
        check(sql_values == ts_values, f"{col} == {type_name}", detail)

    # ---- Every Vehicle field has a column ----------------------------------
    print("\n== Every field on `Vehicle` has a column ==")
    iface = re.search(r"export interface Vehicle \{(.*?)\n\}", ts, re.S)
    if not iface:
        check(False, "the Vehicle interface was found", "regex found nothing")
        return 1

    fields = re.findall(r"^\s{2}(\w+)\??:", iface.group(1), re.M)
    columns = set(
        re.findall(
            r"^\s{2}(\w+)\s+(?:text|smallint|integer|boolean|timestamptz|text\[\])",
            sql,
            re.M,
        )
    )

    missing = [f for f in fields if to_snake(f) not in columns]
    check(
        not missing,
        f"all {len(fields)} Vehicle fields map to a column",
        "missing: " + ", ".join(missing) if missing else "none missing",
    )

    extra = sorted(columns - {to_snake(f) for f in fields} - EXTRA_COLUMNS)
    check(
        not extra,
        "no unexpected columns",
        "unexpected: " + ", ".join(extra) if extra else "none",
    )

    # ---- The Storage bucket name, which lives in three files ---------------
    #
    # Nothing makes these agree. The bucket is named in the SQL that grants
    # upload rights, in the app constant the upload path uses, and in the URLs
    # already stored in the `image` column. A typo in the SQL does not fail the
    # migration — it creates a policy that grants nothing, so every upload is
    # refused with a permissions error that points at the wrong thing entirely.
    print("\n== The Storage bucket name agrees across the project ==")

    bucket_sources: dict[str, set[str]] = {}

    if ACTIONS.exists():
        actions = ACTIONS.read_text(encoding="utf-8")
        found = set(re.findall(r'STORAGE_BUCKET\s*=\s*"([^"]+)"', actions))
        bucket_sources["the upload action"] = found
        check(len(found) == 1, "the app names exactly one bucket", ", ".join(sorted(found)))
    else:
        check(False, "the upload action exists", str(ACTIONS))

    for label, path, pattern in (
        ("0002_admin_access.sql", ADMIN_SQL, r"bucket_id\s*=\s*'([^']+)'"),
        ("seed-storage.sql", SEED_STORAGE, r"/object/public/([^/]+)/"),
    ):
        if not path.exists():
            check(False, f"{label} exists", str(path))
            continue
        found = set(re.findall(pattern, path.read_text(encoding="utf-8")))
        bucket_sources[label] = found
        check(len(found) == 1, f"{label} names exactly one bucket", ", ".join(sorted(found)))

    names = [name for found in bucket_sources.values() for name in found]
    if names:
        check(
            len(set(names)) == 1,
            "every file agrees on the bucket name",
            " -> ".join(f"{k}={sorted(v)}" for k, v in bucket_sources.items()),
        )
    else:
        check(False, "the bucket name could be read from anywhere", "no matches")

    # ---- Optional: SQL syntax ---------------------------------------------
    try:
        import pglast  # type: ignore

        print("\n== Migration parses as valid SQL ==")
        try:
            statements = pglast.parse_sql(sql)
            check(True, "the migration parses", f"{len(statements)} statements")
        except Exception as exc:  # noqa: BLE001 - surfaced verbatim on purpose
            check(False, "the migration parses", str(exc).splitlines()[0])
    except ImportError:
        print("\n== SQL syntax ==")
        print("  SKIP  pglast is not installed — paste the file into the Supabase")
        print("        SQL editor to have it validated there instead.")

    print(f"\n{passed}/{passed + failed} checks passed.")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
