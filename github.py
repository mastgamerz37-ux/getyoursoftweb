"""
github.py — Pure Python GitHub Repository Creator & Uploader for GetYourSoft / Vesper.ai
Created & Developed by Anshu Dubey

Features:
- Pure Python using GitHub REST API v3 (No Git CLI or installation required).
- Automatically detects your GitHub username from your Personal Access Token (PAT).
- Prompts for or accepts custom repository name (e.g. ansh-website, vesper-ai, or ansh-ai).
- Automatically creates the repository on GitHub if it doesn't already exist.
- Detects the default branch (main/master) automatically.
- Safely excludes sensitive environment files (.env) while uploading .env.example.
- Shows real-time upload progress with file status.
"""
from __future__ import annotations

import os
import sys
import json
import base64
import argparse
import urllib.request
import urllib.error
from pathlib import Path

# Files and directories to strictly ignore to protect secrets and avoid bloat
IGNORED_DIR_NAMES = {
    "venv", ".venv", "env", "ENV", "build", "dist", "__pycache__",
    "scratch", ".vscode", ".idea", ".git", "ansh_ai.egg-info",
    "release", "release_app", "AnshAI_Release", "node_modules"
}

IGNORED_EXACT_FILES = {
    ".env",                    # Protect sensitive bot tokens and API keys!
    "keys/product_keys.txt",
    "keys/generate_keys.py",
    "config/api_keys.json",
    "config/license.json",
    "installer/release/ANSH_Setup_v1.0.exe"
}

IGNORED_EXTENSIONS = {
    ".pyc", ".pyo", ".pyd", ".exe", ".spec", ".egg", ".swp", ".swo"
}


def should_ignore(rel_path: str) -> bool:
    normalized = rel_path.replace("\\", "/")
    
    # Ignore exact files
    if normalized in IGNORED_EXACT_FILES or normalized == ".env":
        return True
        
    parts = normalized.split("/")
    
    # Ignore blacklisted directories
    for part in parts:
        if part in IGNORED_DIR_NAMES or part.endswith(".egg-info"):
            return True
            
    # Ignore binary compiled extensions
    filename = parts[-1]
    ext = os.path.splitext(filename)[1].lower()
    if ext in IGNORED_EXTENSIONS:
        return True
        
    # Ignore OS noise
    if filename in (".DS_Store", "Thumbs.db"):
        return True

    return False


def get_all_files(base_dir: Path) -> list[Path]:
    file_list: list[Path] = []
    for root, dirs, files in os.walk(base_dir):
        # Prune ignored directory traversal
        dirs[:] = [
            d for d in dirs 
            if not should_ignore(str(Path(root, d).relative_to(base_dir)))
        ]
        for file in files:
            full_path = Path(root, file)
            rel_path = str(full_path.relative_to(base_dir))
            if not should_ignore(rel_path):
                file_list.append(full_path)
    return sorted(file_list)


def get_authenticated_user(token: str) -> str | None:
    """Verifies token and retrieves GitHub username."""
    req = urllib.request.Request(
        "https://api.github.com/user",
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Vesper-Uploader"
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("login")
    except urllib.error.HTTPError as he:
        print(f"❌ Authentication Failed: HTTP {he.code} — {he.reason}")
    except Exception as ex:
        print(f"❌ Connection error: {ex}")
    return None


def ensure_repo_exists(token: str, owner: str, repo: str, is_private: bool = False) -> tuple[bool, str]:
    """Verifies that the repository exists on GitHub, creates it if missing. Returns (success, default_branch)."""
    check_url = f"https://api.github.com/repos/{owner}/{repo}"
    req = urllib.request.Request(
        check_url,
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Vesper-Uploader"
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                default_branch = data.get("default_branch", "main")
                print(f"✅ Repository '{owner}/{repo}' found (default branch: '{default_branch}').")
                return True, default_branch
    except urllib.error.HTTPError as he:
        if he.code == 404:
            print(f"📦 Repository '{owner}/{repo}' not found. Creating it now...")
            create_url = "https://api.github.com/user/repos"
            payload = {
                "name": repo,
                "description": "Vesper.ai / GetYourSoft — Operational AI Infrastructure & Desktop Intelligence Website",
                "private": is_private,
                "auto_init": True
            }
            create_req = urllib.request.Request(
                create_url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github.v3+json",
                    "Content-Type": "application/json",
                    "User-Agent": "Vesper-Uploader"
                },
                method="POST"
            )
            try:
                with urllib.request.urlopen(create_req) as create_resp:
                    if create_resp.status in (200, 201):
                        data = json.loads(create_resp.read().decode("utf-8"))
                        default_branch = data.get("default_branch", "main")
                        print(f"🎉 Successfully created repository '{owner}/{repo}' on GitHub!")
                        return True, default_branch
            except Exception as e:
                print(f"❌ Failed to automatically create repo: {e}")
                return False, "main"
        else:
            print(f"❌ GitHub API Error: HTTP {he.code} — {he.reason}")
            return False, "main"
    except Exception as ex:
        print(f"❌ Connection error: {ex}")
        return False, "main"
    return True, "main"


def upload_file_to_github(token: str, owner: str, repo: str, branch: str, base_dir: Path, file_path: Path) -> bool:
    rel_path = str(file_path.relative_to(base_dir)).replace("\\", "/")
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{rel_path}"

    try:
        content_bytes = file_path.read_bytes()
        encoded_content = base64.b64encode(content_bytes).decode("utf-8")
    except Exception as e:
        print(f"❌ Failed to read {rel_path}: {e}")
        return False

    # Check if file exists to fetch sha for update
    sha = None
    req_check = urllib.request.Request(
        f"{url}?ref={branch}",
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Vesper-Uploader"
        }
    )
    try:
        with urllib.request.urlopen(req_check) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            sha = data.get("sha")
    except urllib.error.HTTPError:
        pass

    payload = {
        "message": f"Sync: {rel_path}",
        "content": encoded_content,
        "branch": branch
    }
    if sha:
        payload["sha"] = sha

    req_upload = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "Vesper-Uploader"
        },
        method="PUT"
    )

    try:
        with urllib.request.urlopen(req_upload) as resp:
            if resp.status in (200, 201):
                return True
    except urllib.error.HTTPError as he:
        try:
            err_body = he.read().decode("utf-8")
            err_json = json.loads(err_body)
            msg = err_json.get("message", he.reason)
        except Exception:
            msg = he.reason
        print(f"\n   ❌ Error ({rel_path}): HTTP {he.code} — {msg}", end="")
    except Exception as ex:
        print(f"\n   ❌ Error ({rel_path}): {ex}", end="")
    return False


def main():
    parser = argparse.ArgumentParser(description="Upload Vesper.ai / ANSH Website to GitHub")
    parser.add_argument("--token", help="GitHub Personal Access Token")
    parser.add_argument("--repo", help="GitHub Repository Name (default: ansh-website)")
    parser.add_argument("--private", action="store_true", help="Make new repository private")
    args = parser.parse_args()

    print("=================================================================")
    print("  Vesper.ai / ANSH AI — GitHub Repository Synchronizer           ")
    print("  Developer: Anshu Dubey | Barnahal, India                       ")
    print("=================================================================\n")

    token = args.token or os.environ.get("GITHUB_TOKEN")
    if not token:
        token = input("🔑 Enter your GitHub Personal Access Token (PAT): ").strip()
    if not token:
        print("❌ Token cannot be empty. Exiting.")
        sys.exit(1)

    print("\n🔍 Authenticating with GitHub API...")
    username = get_authenticated_user(token)
    if not username:
        print("❌ Invalid token or missing 'repo' scope. Please generate a PAT with 'repo' permissions at https://github.com/settings/tokens")
        sys.exit(1)

    print(f"👤 Authenticated as: @{username}")

    repo_name = args.repo
    if not repo_name:
        default_repo = "ansh-website"
        user_repo = input(f"\n📁 Enter repository name [default: '{default_repo}']: ").strip()
        repo_name = user_repo if user_repo else default_repo

    is_private = args.private
    if not args.token:
        priv_choice = input("🔒 Make repository Private? (y/N) [default: Public]: ").strip().lower()
        if priv_choice == "y":
            is_private = True

    print(f"\n🔍 Verifying repository '{username}/{repo_name}'...")
    success, branch = ensure_repo_exists(token, username, repo_name, is_private)
    if not success:
        print("❌ Could not verify or create repository. Please check your token permissions.")
        sys.exit(1)

    base_dir = Path(__file__).resolve().parent
    files = get_all_files(base_dir)

    print(f"\n🚀 Found {len(files)} clean production files to sync to branch '{branch}'.\n")
    print("⚠️ Note: Sensitive '.env' file is strictly excluded for security.\n")

    success_count = 0
    for idx, f in enumerate(files, 1):
        rel = str(f.relative_to(base_dir)).replace("\\", "/")
        print(f"[{idx:02d}/{len(files):02d}] Uploading: {rel}...", end="", flush=True)
        if upload_file_to_github(token, username, repo_name, branch, base_dir, f):
            print(" ✅ OK")
            success_count += 1
        else:
            print(" ❌ FAILED")

    print(f"\n🎉 Finished! Uploaded {success_count}/{len(files)} files successfully!")
    print(f"🔗 View your repository live at: https://github.com/{username}/{repo_name}\n")


if __name__ == "__main__":
    main()
