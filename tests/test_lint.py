import subprocess
import sys


def test_lint():
    """Runs ruff check as a unit test to enforce linting rules."""
    result = subprocess.run(
        [sys.executable, "-m", "ruff", "check", "src", "tests"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, (
        f"Ruff linting check failed:\n{result.stdout}\n{result.stderr}"
    )


def test_format():
    """Runs ruff format --check as a unit test to enforce code style formatting."""
    result = subprocess.run(
        [sys.executable, "-m", "ruff", "format", "--check", "src", "tests"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, (
        f"Ruff formatting check failed (run 'make format' to fix):\n{result.stdout}\n{result.stderr}"
    )
