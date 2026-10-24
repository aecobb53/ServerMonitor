import json
from pathlib import Path

from src.config import Config
from src.defaults import DEFAULT_SERVER_CONTENT
from src.reporter import Reporter


def make_reporter(tmp_path: Path) -> Reporter:
    return Reporter(Config(
        storage=str(tmp_path),
        content_dir=str(tmp_path / "content"),
        version="0.0.0",
        control_core_url="http://127.0.0.1:1",
        control_core_key="key",
        callback_url=None,
        retry_initial_seconds=0,
        retry_max_seconds=0,
        log_level="WARNING",
    ))


def test_missing_content_uses_builtin_default_and_creates_directory(tmp_path):
    content = make_reporter(tmp_path).load_server_content("Foo", "Valheim")

    assert content["server_name"] == "Foo"
    assert content["display_name"] == "Foo"
    assert content["game"] == "Valheim"
    assert content["description"] == DEFAULT_SERVER_CONTENT["description"]
    assert json.loads((tmp_path / "content" / "Foo.json").read_text()) == content
    assert DEFAULT_SERVER_CONTENT["server_name"] == "template"


def test_template_file_overrides_builtin_default(tmp_path):
    (tmp_path / "content").mkdir()
    (tmp_path / "content" / "_template.json").write_text(json.dumps({"description": "Custom"}))

    content = make_reporter(tmp_path).load_server_content("Foo", None)

    assert content["description"] == "Custom"


def test_broken_template_falls_back_to_builtin_default(tmp_path):
    (tmp_path / "content").mkdir()
    (tmp_path / "content" / "_template.json").write_text("{not json")

    content = make_reporter(tmp_path).load_server_content("Foo", None)

    assert content["description"] == DEFAULT_SERVER_CONTENT["description"]


def test_unsafe_server_name_is_rejected(tmp_path):
    assert make_reporter(tmp_path).load_server_content("../evil", None) is None
