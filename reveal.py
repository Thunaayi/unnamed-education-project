import pyautogui
import time
import random
import argparse
import sys
import os

def main():
    parser = argparse.ArgumentParser(description="Simulate typing a file's content into VS Code for video recording.")
    parser.add_argument("file_path", help="Path to the file to type out.")
    parser.add_argument("--delay-char", type=float, nargs=2, default=[0.003, 0.01], metavar=('MIN', 'MAX'),
                        help="Min and max delay between characters in seconds (default: 0.003 0.01).")
    parser.add_argument("--delay-line", type=float, nargs=2, default=[0.08, 0.15], metavar=('MIN', 'MAX'),
                        help="Min and max delay after newlines in seconds (default: 0.08 0.15).")
    parser.add_argument("--no-test", action="store_true", help="Skip the initial test message.")
    parser.add_argument("--speed", choices=['slow', 'medium', 'fast'], default='medium',
                        help="Preset speed: slow (2x delays), medium (default), fast (0.5x delays).")

    args = parser.parse_args()

    # Adjust delays based on speed
    speed_multiplier = {'slow': 2.0, 'medium': 1.0, 'fast': 0.5}[args.speed]
    char_min, char_max = [d * speed_multiplier for d in args.delay_char]
    line_min, line_max = [d * speed_multiplier for d in args.delay_line]

    file_path = args.file_path

    if not os.path.isfile(file_path):
        print(f"Error: File '{file_path}' not found.")
        sys.exit(1)

    print("Switch to VS Code NOW")
    print("Click inside the code editor")
    print("You have 8 seconds")

    time.sleep(8)

    try:
        if not args.no_test:
            # Force a visible test tocl| 'long';
            #  confirm focus
            pyautogui.press("enter")
            time.sleep(0.5)
    except Exception as e:
        print(f"Error with PyAutoGUI (check display/focus): {e}")
        sys.exit(1)

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

    try:
        for char in content:
            pyautogui.write(char)

            if char == "\n":
                time.sleep(random.uniform(line_min, line_max))
            else:
                time.sleep(random.uniform(char_min, char_max))
    except Exception as e:
        print(f"Error during typing: {e}")
        sys.exit(1)

    print("Done typing.")

if __name__ == "__main__":
    main()