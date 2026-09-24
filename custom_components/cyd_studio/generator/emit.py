"""Deterministic YAML emitter for ESPHome configurations.

PyYAML cannot emit ESPHome tags (``!secret``, ``!lambda``) together with
comments in a stable, readable way, so this small emitter does it.
Documents are built from plain dicts/lists plus the marker classes below.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from yaml import ScalarNode
from yaml.resolver import Resolver

INDENT = "  "

_PLAIN_RE = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9_./\-]*$")
# Words that other YAML 1.1 parsers read as booleans/null even though PyYAML does not
_RESERVED = {"yes", "no", "on", "off", "true", "false", "null", "~"}
_RESOLVER = Resolver()


def _is_plain_safe(value: str) -> bool:
    """True if ``value`` reads back as the same string when emitted unquoted."""
    if not _PLAIN_RE.match(value) or value.lower() in _RESERVED:
        return False
    tag: str = _RESOLVER.resolve(ScalarNode, value, (True, False))  # type: ignore[no-untyped-call]
    return tag == "tag:yaml.org,2002:str"


@dataclass(frozen=True)
class Secret:
    """``!secret name``."""

    name: str


@dataclass(frozen=True)
class Lambda:
    """``!lambda`` with C++ code (emitted as block scalar)."""

    code: str


@dataclass(frozen=True)
class Raw:
    """Emit the value verbatim (e.g. hex colors ``0x22D3EE``)."""

    text: str


@dataclass(frozen=True)
class Comment:
    """A comment line. Use as list item or as dict key (value is ignored)."""

    text: str


def quote(text: str) -> str:
    """Return a YAML double-quoted scalar."""
    out = []
    for ch in text:
        code = ord(ch)
        if ch == "\\":
            out.append("\\\\")
        elif ch == '"':
            out.append('\\"')
        elif ch == "\n":
            out.append("\\n")
        elif ch == "\t":
            out.append("\\t")
        elif code < 0x20 or code == 0x7F:
            out.append(f"\\x{code:02x}")
        elif 0xE000 <= code <= 0xF8FF or code >= 0xF0000:
            # Private use area (icon glyphs): keep readable and ASCII safe
            out.append(f"\\U{code:08X}")
        else:
            out.append(ch)
    return '"' + "".join(out) + '"'


def scalar(value: Any) -> str:
    """Format a scalar value."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        text = repr(value)
        return text
    if isinstance(value, Secret):
        return f"!secret {value.name}"
    if isinstance(value, Raw):
        return value.text
    if isinstance(value, str):
        if _is_plain_safe(value):
            return value
        return quote(value)
    raise TypeError(f"Unsupported scalar: {value!r}")


def _is_scalar(value: Any) -> bool:
    return not isinstance(value, (dict, list, Lambda))


def _lambda_lines(code: str, indent: str) -> list[str]:
    lines = code.strip("\n").split("\n")
    return [indent + INDENT + line if line else "" for line in lines]


def _emit_map(data: dict[Any, Any], indent: str) -> list[str]:
    lines: list[str] = []
    for key, value in data.items():
        if isinstance(key, Comment):
            lines.append(f"{indent}# {key.text}".rstrip())
            continue
        k = scalar(key)
        lines.extend(_emit_entry(f"{indent}{k}:", value, indent))
    return lines


def _emit_entry(prefix: str, value: Any, indent: str) -> list[str]:
    """Emit ``prefix`` (``key:`` or ``-``) followed by ``value``."""
    if isinstance(value, Lambda):
        return [f"{prefix} !lambda |-", *_lambda_lines(value.code, indent)]
    if isinstance(value, dict):
        if not value:
            return [f"{prefix} {{}}"]
        return [prefix, *_emit_map(value, indent + INDENT)]
    if isinstance(value, list):
        if not value:
            return [f"{prefix} []"]
        return [prefix, *_emit_list(value, indent + INDENT)]
    text = scalar(value)
    return [f"{prefix} {text}" if text else prefix]


def _emit_list(items: list[Any], indent: str) -> list[str]:
    lines: list[str] = []
    for item in items:
        if isinstance(item, Comment):
            lines.append(f"{indent}# {item.text}".rstrip())
            continue
        if isinstance(item, dict) and item:
            sub = _emit_map(item, indent + INDENT)
            # Put the first real key on the dash line
            for i, line in enumerate(sub):
                if not line.lstrip().startswith("#"):
                    sub[i] = f"{indent}- " + line[len(indent) + len(INDENT) :]
                    break
            lines.extend(sub)
        elif isinstance(item, list | Lambda):
            lines.extend(_emit_entry(f"{indent}-", item, indent))
        else:
            lines.append(f"{indent}- {scalar(item)}")
    return lines


def dump(document: dict[Any, Any]) -> str:
    """Emit a top level mapping. Top level sections are separated by blank lines."""
    out: list[str] = []
    for key, value in document.items():
        if isinstance(key, Comment):
            out.append(f"# {key.text}".rstrip())
            continue
        if out and not out[-1].startswith("#"):
            out.append("")
        out.extend(_emit_entry(f"{scalar(key)}:", value, ""))
    return "\n".join(out) + "\n"
