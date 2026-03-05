"""
AnjaarFinance - License Key Generator
Run this on your PC to generate registration keys.
Share one key per user.
"""

import hashlib
import random
import string
import json
import os
from datetime import datetime

# ══════════════════════════════════════
# SECRET SALT — NEVER SHARE THIS
# Change this to your own secret word
# ══════════════════════════════════════
SECRET_SALT = "ANJAARFINANCE2026ANKESH"

KEYS_FILE = "generated_keys.json"


def generate_key():
    """Generate a unique 20-char key in format: XXXXX-XXXXX-XXXXX-XXXXX"""
    chars = string.ascii_uppercase + string.digits
    # Remove confusing characters
    chars = chars.replace("O", "").replace("0", "").replace("I", "").replace("1", "")
    segments = []
    for _ in range(4):
        segment = ''.join(random.choices(chars, k=5))
        segments.append(segment)
    return '-'.join(segments)


def sign_key(raw_key):
    """Create a signed version of key using SECRET_SALT so app can verify"""
    combined = raw_key + SECRET_SALT
    signature = hashlib.sha256(combined.encode()).hexdigest()[:8].upper()
    return raw_key + "-" + signature


def load_existing_keys():
    if os.path.exists(KEYS_FILE):
        with open(KEYS_FILE, "r") as f:
            return json.load(f)
    return []


def save_keys(keys):
    with open(KEYS_FILE, "w") as f:
        json.dump(keys, f, indent=2)


def generate_batch(count):
    existing = load_existing_keys()
    existing_raw = {k["key"] for k in existing}

    new_keys = []
    generated = 0

    while generated < count:
        raw = generate_key()
        signed = sign_key(raw)
        if signed not in existing_raw:
            entry = {
                "key":        signed,
                "generated":  datetime.now().strftime("%d-%b-%Y %H:%M"),
                "used":       False,
                "used_by":    "",
                "notes":      ""
            }
            new_keys.append(entry)
            existing_raw.add(signed)
            generated += 1

    all_keys = existing + new_keys
    save_keys(all_keys)

    print(f"\n{'='*50}")
    print(f"  Generated {count} new keys:")
    print(f"{'='*50}")
    for k in new_keys:
        print(f"  {k['key']}")
    print(f"{'='*50}")
    print(f"\nAll keys saved to: {KEYS_FILE}")
    print(f"Total keys so far: {len(all_keys)}")

    return new_keys


def list_all_keys():
    keys = load_existing_keys()
    if not keys:
        print("\nNo keys generated yet.")
        return

    print(f"\n{'='*70}")
    print(f"  {'KEY':<30} {'GENERATED':<20} {'STATUS':<10} {'NOTES'}")
    print(f"{'='*70}")
    for k in keys:
        status = "USED" if k.get("used") else "AVAILABLE"
        notes  = k.get("notes") or k.get("used_by") or ""
        print(f"  {k['key']:<30} {k['generated']:<20} {status:<10} {notes}")
    print(f"{'='*70}")
    print(f"  Total: {len(keys)} | Used: {sum(1 for k in keys if k.get('used'))} | Available: {sum(1 for k in keys if not k.get('used'))}")


def mark_used(key, notes=""):
    keys = load_existing_keys()
    for k in keys:
        if k["key"] == key:
            k["used"]    = True
            k["used_by"] = datetime.now().strftime("%d-%b-%Y")
            k["notes"]   = notes
            save_keys(keys)
            print(f"Marked as used: {key}")
            return
    print(f"Key not found: {key}")


def main():
    print("\n╔══════════════════════════════════════╗")
    print("║  AnjaarFinance Key Generator          ║")
    print("╚══════════════════════════════════════╝")

    while True:
        print("\nOptions:")
        print("  1. Generate new keys")
        print("  2. List all keys")
        print("  3. Mark a key as used")
        print("  4. Exit")

        choice = input("\nEnter choice (1-4): ").strip()

        if choice == "1":
            try:
                count = int(input("How many keys to generate? ").strip())
                generate_batch(count)
            except ValueError:
                print("Please enter a valid number.")

        elif choice == "2":
            list_all_keys()

        elif choice == "3":
            key   = input("Enter key to mark as used: ").strip().upper()
            notes = input("Notes (e.g. given to Abhishek): ").strip()
            mark_used(key, notes)

        elif choice == "4":
            print("\nGoodbye!")
            break
        else:
            print("Invalid choice.")

if __name__ == "__main__":
    main()
