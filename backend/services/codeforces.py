"""Everything that talks to the Codeforces API.

API docs: https://codeforces.com/apiHelp
- user.status         every submission a handle has made (sync)
- user.info           current and best rating (sync)
- problemset.problems the full problem list (sheet search), cached in memory
"""
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from db import execute
from routes.problems import save_problem

API = "https://codeforces.com/api/"

# Codeforces verdict -> the verdicts our CHECK constraint allows.
# Anything else (TESTING, SKIPPED, PARTIAL, ...) is not stored.
VERDICTS = {
    "OK": "OK",
    "WRONG_ANSWER": "WRONG_ANSWER",
    "CHALLENGED": "WRONG_ANSWER",  # hacked during the contest
    "TIME_LIMIT_EXCEEDED": "TIME_LIMIT_EXCEEDED",
    "IDLENESS_LIMIT_EXCEEDED": "TIME_LIMIT_EXCEEDED",
    "RUNTIME_ERROR": "RUNTIME_ERROR",
    "MEMORY_LIMIT_EXCEEDED": "MEMORY_LIMIT_EXCEEDED",
    "COMPILATION_ERROR": "COMPILATION_ERROR",
}


class CodeforcesError(Exception):
    pass


# Codeforces allows about one API call every 2 seconds.
_last_call = {"at": 0.0}


def call_api(method, **params):
    """Call one Codeforces API method and return its "result"."""
    wait = 2 - (time.time() - _last_call["at"])
    if wait > 0:
        time.sleep(wait)
    _last_call["at"] = time.time()

    url = API + method + "?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            data = json.load(response)
    except urllib.error.HTTPError as error:
        data = json.load(error)  # Codeforces explains the problem in the body
    except urllib.error.URLError:
        raise CodeforcesError("Could not reach Codeforces. Try again in a minute.")

    if data.get("status") != "OK":
        raise CodeforcesError(data.get("comment", "Codeforces returned an error"))
    return data["result"]


# ------------------------------------------------------------------ sync

def update_rating(user_id, handle):
    """Store the handle's current and best rating in app_user."""
    info = call_api("user.info", handles=handle)[0]
    execute(
        "UPDATE app_user SET cf_rating = %s, cf_max_rating = %s WHERE user_id = %s",
        (info.get("rating"), info.get("maxRating"), user_id),
    )


def sync_user(user_id, handle):
    """Store every new submission of `handle` for `user_id`. Returns counts."""
    new_problems = 0
    new_submissions = 0
    seen_problems = set()

    update_rating(user_id, handle)

    for item in call_api("user.status", handle=handle):
        problem = item["problem"]
        verdict = VERDICTS.get(item.get("verdict"))
        if "contestId" not in problem or verdict is None:
            continue

        problem_code = f"{problem['contestId']}{problem['index']}"
        if problem_code not in seen_problems:
            seen_problems.add(problem_code)
            # Tags like "*special" are Codeforces markers, not topics.
            topics = [tag for tag in problem.get("tags", []) if not tag.startswith("*")]
            if save_problem(problem_code, problem["name"], problem.get("rating"), topics):
                new_problems += 1

        submitted_at = datetime.fromtimestamp(item["creationTimeSeconds"], timezone.utc).replace(tzinfo=None)
        added = execute(
            """
            INSERT INTO submission (user_id, problem_code, submitted_at, verdict, language)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id, problem_code, submitted_at) DO NOTHING
            RETURNING 1
            """,
            (user_id, problem_code, submitted_at, verdict, item["programmingLanguage"][:50]),
        )
        if added:
            new_submissions += 1

    return {"new_problems": new_problems, "new_submissions": new_submissions}


# ------------------------------------------------------------------ problem search

CACHE_SECONDS = 6 * 60 * 60
_problemset = {"fetched_at": 0, "problems": {}}


def problemset():
    """Every Codeforces problem, keyed by code. Downloaded at most every 6 hours."""
    if time.time() - _problemset["fetched_at"] > CACHE_SECONDS:
        result = call_api("problemset.problems")
        solved_counts = {
            f"{s['contestId']}{s['index']}": s["solvedCount"]
            for s in result["problemStatistics"]
            if "contestId" in s
        }
        problems = {}
        for p in result["problems"]:
            if "contestId" not in p:
                continue
            code = f"{p['contestId']}{p['index']}"
            problems[code] = {
                "problem_code": code,
                "title": p["name"],
                "rating": p.get("rating"),
                "tags": [t for t in p.get("tags", []) if not t.startswith("*")],
                "solved_count": solved_counts.get(code, 0),
            }
        _problemset.update(fetched_at=time.time(), problems=problems)
    return _problemset["problems"]


def search_problems(text="", tag="", min_rating=None, max_rating=None, limit=50):
    """Filter the problemset. Newest contests first, like the Codeforces site."""
    text = text.strip().lower()
    results = []
    for p in problemset().values():
        # Match the title, or the code: "455" lists 455A, 455B, ...
        if text and text not in p["title"].lower() and not p["problem_code"].lower().startswith(text):
            continue
        if tag and tag not in p["tags"]:
            continue
        if min_rating and (p["rating"] is None or p["rating"] < min_rating):
            continue
        if max_rating and (p["rating"] is None or p["rating"] > max_rating):
            continue
        results.append(p)
        if len(results) == limit:
            break
    return results


def all_tags():
    return sorted({tag for p in problemset().values() for tag in p["tags"]})


def ensure_problem(problem_code):
    """Make sure a Codeforces problem is in our `problem` table (needed before
    a sheet can reference it, because of the foreign key)."""
    p = problemset().get(problem_code)
    if p is None:
        return False
    save_problem(p["problem_code"], p["title"], p["rating"], p["tags"])
    return True
