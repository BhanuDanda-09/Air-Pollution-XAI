import subprocess
import re

def count_test_cases(content, filename):
    if filename.endswith(".py"):
        # Match def test_ or class Test
        return len(re.findall(r"^\s*def\s+(test_\w+)", content, re.MULTILINE))
    elif filename.endswith(".js") or filename.endswith(".mjs"):
        # Match test(..., it(..., or runner assert blocks
        tests = re.findall(r"(?:it|test)\s*\(\s*['\"`]|assert(?:Equal|StrictEqual|Ok)?\(|console\.log\(['\"`][✓✔]|case\s+['\"`]", content)
        # Also check for describe blocks or custom test arrays
        explicit = len(re.findall(r"^\s*(?:it|test)\s*\(", content, re.MULTILINE))
        if explicit > 0:
            return explicit
        assertions = len(re.findall(r"assert\.", content))
        if assertions > 0:
            return assertions
        return len(re.findall(r"console\.log\(['\"`][✓✔]", content)) or 1
    return 0

def get_file_content_at_commit(commit, filepath):
    try:
        res = subprocess.run(["git", "show", f"{commit}:{filepath}"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return res.stdout
    except subprocess.CalledProcessError:
        return None

def main():
    commit_before = "7003926"
    commit_after = "HEAD"

    # Get test files in 7003926
    out_before = subprocess.check_output(["git", "ls-tree", "-r", "--name-only", commit_before], text=True)
    test_files_before = [f for f in out_before.splitlines() if ("test" in f.lower() or "verify" in f.lower()) and not f.startswith("frontend/node_modules") and not f.startswith(".venv") and not f.endswith(".pyc")]

    # Get test files in HEAD
    out_after = subprocess.check_output(["git", "ls-tree", "-r", "--name-only", commit_after], text=True)
    test_files_after = [f for f in out_after.splitlines() if ("test" in f.lower() or "verify" in f.lower()) and not f.startswith("frontend/node_modules") and not f.startswith(".venv") and not f.endswith(".pyc")]

    all_files = sorted(list(set(test_files_before + test_files_after)))

    print("==========================================================================================")
    print(f"Test Suite Comparison Across Commits {commit_before} -> {commit_after}")
    print("==========================================================================================")
    print(f"{'File Path':<48} | {'Commit 7003926':<15} | {'Commit HEAD':<15} | {'Status':<12}")
    print("-" * 96)

    total_cases_before = 0
    total_cases_after = 0

    for f in all_files:
        c_before = get_file_content_at_commit(commit_before, f)
        c_after = get_file_content_at_commit(commit_after, f)

        cases_before = count_test_cases(c_before, f) if c_before else 0
        cases_after = count_test_cases(c_after, f) if c_after else 0

        total_cases_before += cases_before
        total_cases_after += cases_after

        if c_before is None and c_after is not None:
            status = "Added"
            val_before = "—"
            val_after = f"{cases_after} cases"
        elif c_before is not None and c_after is None:
            status = "Removed"
            val_before = f"{cases_before} cases"
            val_after = "—"
        else:
            diff = cases_after - cases_before
            status = "Maintained" if diff == 0 else (f"+{diff} cases" if diff > 0 else f"{diff} cases")
            val_before = f"{cases_before} cases"
            val_after = f"{cases_after} cases"

        print(f"{f:<48} | {val_before:<15} | {val_after:<15} | {status:<12}")

    print("-" * 96)
    print(f"{'TOTAL TEST CASES':<48} | {total_cases_before:<15} | {total_cases_after:<15} | +{total_cases_after - total_cases_before} net gain")
    print("==========================================================================================")

if __name__ == "__main__":
    main()
