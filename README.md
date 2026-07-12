# tuitask

`tuitask` is a local-first terminal task manager built with TypeScript, React, Ink, and SQLite. Tasks support multiline descriptions, priorities, date-only due dates, completion tracking, automatic ordering, and Active, Completed, and All views. This is all AI.

## Requirements

- Node.js 22 or a newer compatible LTS release
- npm

## Install and run

From a checkout:

```sh
npm install
npm run build
npm link
tuitask
```

For development, use `npm run dev`. Run `npm run verify` before contributing; it checks types, linting, formatting, tests, and the production build.

`tuitask` runs in the terminal's alternate screen buffer, so your previous terminal contents are restored when the app exits. Terminal scrollback is unavailable while the app is running.

## Keybindings

Main list:

| Key        | Action                                  |
| ---------- | --------------------------------------- |
| Up / `k`   | Select previous task                    |
| Down / `j` | Select next task                        |
| `a`        | Add task                                |
| `e`        | Edit selected task                      |
| Space      | Complete or reopen selected task        |
| `d`        | Delete selected task after confirmation |
| `f`        | Cycle Active, Completed, and All        |
| `c`        | Copy filtered tasks as CSV              |
| `?`        | Open help                               |
| `q`        | Quit                                    |

Forms use Tab and Shift+Tab to move, Enter to activate the focused control, and Esc to cancel. Enter inserts a newline while the description is focused. Use the arrow keys or Space on the priority field. A `q` entered in a text field is normal text and does not quit.

Delete confirmation defaults to Cancel. Press `y` to confirm, `n` or Esc to cancel, or use Tab and Enter to choose explicitly.

Due dates accept `YYYY-MM-DD`, `today`, `tomorrow`, or blank for no due date. Dates are interpreted in the local timezone.

Active tasks due today are labeled `DUE TODAY` and shown in yellow. Overdue tasks are labeled `OVERDUE` and shown in red. The text labels remain meaningful in terminals without color support.

## Data storage

The SQLite database is created and migrated automatically. Its default location is:

- Linux: `$XDG_DATA_HOME/tuitask/tasks.sqlite`, or `~/.local/share/tuitask/tasks.sqlite`
- macOS: `~/Library/Application Support/tuitask/tasks.sqlite`
- Windows: `%APPDATA%/tuitask/tasks.sqlite`

Set `TUITASK_DB_PATH` to use a specific file:

```sh
TUITASK_DB_PATH=/path/to/tasks.sqlite tuitask
```

To back up data, exit `tuitask` and copy the SQLite file. The environment override is useful for testing a backup without replacing the production database.

## Troubleshooting

- If startup reports a database error, verify that the database directory exists or can be created and is writable.
- Set `TUITASK_DB_PATH` to a writable path to isolate path or permission problems.
- Resize terminals smaller than 40 columns by 10 rows; the app intentionally shows a resize message instead of rendering an unsafe layout.
- Run `npm run verify` when diagnosing a source checkout.
- If the terminal display is left in an unusual state after an external hard kill, run `reset` on Unix-like systems or reopen the terminal.
