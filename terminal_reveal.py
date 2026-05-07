import argparse
import os
import sys
import time
import random


def wait_for_keypress():
    try:
        import termios
        import tty
    except ImportError:
        input()
        return

    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)


def main():
    parser = argparse.ArgumentParser(
        description="Type a file's contents in the terminal with a typing animation."
    )
    parser.add_argument("file_path", help="Path to the file to type into the terminal.")
    parser.add_argument(
        "--delay-char",
        type=float,
        nargs=2,
        default=[0.005, 0.012],
        metavar=("MIN", "MAX"),
        help="Min and max delay between characters in seconds.",
    )
    parser.add_argument(
        "--delay-line",
        type=float,
        nargs=2,
        default=[0.05, 0.12],
        metavar=("MIN", "MAX"),
        help="Min and max delay after newline characters in seconds.",
    )
    parser.add_argument(
        "--speed",
        choices=["slow", "medium", "fast"],
        default="medium",
        help="Preset speed multiplier: slow, medium, fast.",
    )
    parser.add_argument(
        "--header",
        action="store_true",
        help="Print a small header before typing.",
    )
    parser.add_argument(
        "--no-end-wait",
        action="store_true",
        help="Do not wait for a final keypress after typing.",
    )

    args = parser.parse_args()
    args.end_wait = not args.no_end_wait
    speed_multiplier = {"slow": 2.0, "medium": 1.0, "fast": 0.5}[args.speed]
    char_min, char_max = [d * speed_multiplier for d in args.delay_char]
    line_min, line_max = [d * speed_multiplier for d in args.delay_line]

    if not os.path.isfile(args.file_path):
        print(f"Error: file '{args.file_path}' does not exist.")
        sys.exit(1)

    try:
        with open(args.file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as exc:
        print(f"Error reading file: {exc}")
        sys.exit(1)

    sys.stdout.write("\x1b[2J\x1b[H")  # clear screen and move cursor to top-left
    sys.stdout.write("\x1b[?25l")  # hide cursor
    sys.stdout.flush()

    if args.header:
        print(f"Typing {args.file_path} in the terminal...")
        print("Press any key to begin.")
        sys.stdout.flush()

    wait_for_keypress()

    try:
        for char in content:
            sys.stdout.write(char)
            sys.stdout.flush()
            if char == "\n":
                time.sleep(random.uniform(line_min, line_max))
            else:
                time.sleep(random.uniform(char_min, char_max))
    except KeyboardInterrupt:
        sys.stdout.write("\x1b[?25h")
        sys.stdout.flush()
        sys.exit(0)
    except Exception as exc:
        sys.stdout.write("\x1b[?25h")
        sys.stdout.write(f"\nError during typing: {exc}\n")
        sys.stdout.flush()
        sys.exit(1)

    if args.end_wait:
        wait_for_keypress()

    sys.stdout.write("\x1b[?25h")
    sys.stdout.flush()


if __name__ == "__main__":
    main()
