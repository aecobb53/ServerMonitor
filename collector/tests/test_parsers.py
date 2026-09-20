from parsers.common import ServerStatus
from parsers.registry import create_parser


def test_valheim_parser_emits_normalized_event():
    parser = create_parser("valheim")

    event = parser.parse("2026-09-20T12:05:00.000Z Game server connected")

    assert event is not None
    assert event.status is ServerStatus.ONLINE
    assert event.parser_name == "valheim"
    assert event.parser_version == "1.0.0"
    assert event.timestamp == "2026-09-20T12:05:00.000Z"


def test_valheim_parser_analyzes_recent_logs():
    parser = create_parser("valheim")

    result = parser.analyze(["noise", "Game server connected"])

    assert result.status is ServerStatus.ONLINE
    assert result.confidence == "high"


def test_valheim_parser_returns_unknown_without_evidence():
    parser = create_parser("valheim")

    assert parser.analyze(["noise"]).status is ServerStatus.UNKNOWN