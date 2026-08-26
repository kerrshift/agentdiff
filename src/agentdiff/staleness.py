"""F7 — stale-baseline detection (regressional Goodhart guard).

Baselines age silently: a golden trace from three sprints ago still anchors
every diff, but the product it represented no longer exists. This module
makes that age visible so teams re-record baselines deliberately instead of
losing trust in a gate that "just got noisy".
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass

DEFAULT_STALE_DAYS = 30


@dataclass(frozen=True)
class Staleness:
    """How old a baseline file is, and whether that crosses the stale line."""

    age_days: float
    stale_after_days: int
    missing: bool = False

    @property
    def is_stale(self) -> bool:
        return not self.missing and self.age_days > self.stale_after_days

    def render(self) -> str:
        if self.missing:
            return ""
        age = f"{self.age_days:.0f} days" if self.age_days >= 1 else "less than a day"
        line = f"Baseline is {age} old (last modified {time.strftime('%Y-%m-%d', time.localtime(self._mtime))})."
        if self.is_stale:
            line += (
                f" Stale threshold is {self.stale_after_days} days - consider re-recording"
                " it if the agent's expected behavior has legitimately changed"
                " (agentdiff record ... --update-baseline)."
            )
        return line

    _mtime: float = 0.0


def check_baseline_staleness(
    baseline_path: str | os.PathLike,
    stale_after_days: int = DEFAULT_STALE_DAYS,
) -> Staleness:
    """Inspects the baseline file's modification time.

    Missing files return ``missing=True`` with ``is_stale=False`` - a missing
    baseline is a load error, not a staleness problem.
    """
    try:
        mtime = os.path.getmtime(baseline_path)
    except OSError:
        return Staleness(age_days=0.0, stale_after_days=stale_after_days, missing=True)

    age_days = max(0.0, (time.time() - mtime) / 86400)
    return Staleness(age_days=age_days, stale_after_days=stale_after_days, _mtime=mtime)
