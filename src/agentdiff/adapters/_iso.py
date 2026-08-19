"""Robust ISO-8601 timestamp parsing shared across telemetry adapters.

Python's ``datetime.fromisoformat`` is strict about fractional seconds on
Python 3.10 (it requires exactly 6 digits). Telemetry timestamps commonly use
a short fractional part (e.g. ``...00.5Z``) or ``Z``/``+00:00`` offsets. This
helper normalizes both so latency math is identical across Python 3.10+.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

_FRACTION = re.compile(r"\.(\d+)")


def parse_iso_timestamp(value: Any) -> datetime | None:
    """Parse a telemetry timestamp to an aware ``datetime``.

    Returns ``None`` (never raises) when the value cannot be parsed.
    """
    if value is None:
        return None
    text = str(value).replace("Z", "+00:00")
    if "." in text:
        text = _FRACTION.sub(lambda m: "." + m.group(1).ljust(6, "0"), text, count=1)
    try:
        return datetime.fromisoformat(text)
    except (ValueError, TypeError):
        return None
