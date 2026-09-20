from .valheim import ValheimParser


PARSERS = {
    ValheimParser.name: ValheimParser,
}


def create_parser(name: str):
    parser_class = PARSERS.get(name)
    if parser_class is None:
        raise ValueError(f"Unknown parser: {name}")
    return parser_class()