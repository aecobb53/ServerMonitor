## Supported Text Formatting

| Feature | Status | Syntax | Example Input | Example Output |
|---|---|---|---|---|
| Headers | Implemented | `#` through `######` | `## Server Notes` | H2 heading text |
| Unordered list | Implemented | `- item` | `- Iron` | Bulleted list item |
| Ordered list | Implemented | `1. item` | `1. Gather wood` | Numbered list item |
| Bold | Implemented | `**text**` | `**Important**` | Bold text |
| Italic | Implemented | `*text*` | `*Optional*` | Italic text |
| Strikethrough | Implemented | `~~text~~` | `~~Old rule~~` | Struck-through text |
| Inline code | Implemented | `` `text` `` | `` `spawn_rate=2` `` | Inline code styling |
| Subscript | Implemented | `~text~` | `H~2~O` | H₂O |
| Superscript | Implemented | `^text^` | `x^2^` | x² |
| Links | Implemented | `[label](url)` | `[Wiki](https://example.com)` | Clickable link |
| Tables | Not implemented yet | Markdown table syntax | `| A | B |` | No special table rendering yet |
| Colored text | Implemented | `[color:name]text[/color]` | `[color:rare]Loot[/color]` | Colored text/effect by token |
| Colored text with icon | Implemented | `[color:name+icon]text[/color]` | `[color:legendary+icon]Axe[/color]` | Colored text/effect with rarity icon prefix |
| Background highlight color | Implemented | `[highlight:name]text[/highlight]` | `[highlight:yellow]Important[/highlight]` | Highlighted text |

## Notes

- Fenced code blocks are intentionally not supported right now.
- Literal new lines are preserved in rendered output.
- Colored text names: `red`, `green`, `blue`, `orange`, `yellow`, `white`, `black`, `purple`, `poor`, `common`, `uncommon`, `rare`, `epic`, `legendary`, `ancient`, `mythic`.
- Highlight names: `yellow`, `green`, `blue`, `red`, `orange`.
- Links are trusted only for `nax.lol`, `valheim.fandom.com`, `discord.com`, and `store.steampowered.com` domains (including subdomains).
- Non-trusted links remain visible and get a `Not trusted` indicator.

## Supported Color Tokens

| Token | Hex / Style | Effect Summary | Icon Token |
|---|---|---|---|
| red | `#fca5a5` | Soft red text | No |
| green | `#86efac` | Soft green text | No |
| blue | `#93c5fd` | Soft blue text | No |
| orange | `#fdba74` | Soft orange text | No |
| yellow | `#fde68a` | Soft yellow text | No |
| white | `#ffffff` | Pure white text | No |
| black | `#0b0f19` | Near-black text | No |
| purple | `#a335ee` | Purple text | No |
| poor | `#9d9d9d` | Gray text | Yes |
| common | `#ffffff` | White text | Yes |
| uncommon | `#1eff00` | Green text, medium weight | Yes |
| rare | `#0070dd` | Blue text, semibold, subtle glow | Yes |
| epic | `#a335ee` | Purple text, semibold, stronger glow | Yes |
| legendary | `#ff8000 -> #ffd166` | Bold orange-gold gradient with warm glow | Yes |
| ancient | `#00e5ff` | Cyan text, bold, cool glow | Yes |
| mythic | `#ff4fb3 -> #ff3355` | Bold pink-red gradient with glow | Yes |

## Color Syntax

- Base: `[color:token]text[/color]`
- With icon prefix: `[color:token+icon]text[/color]`
- Base: `[highlight:token]text[/highlight]`

