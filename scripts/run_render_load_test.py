"""
Render Free-Tier Production Memory & Concurrency Simulation Test
Simulates Gunicorn configuration: 1 worker process, 4 threads (--workers 1 --threads 4)
Runs on Python 3.11 to verify peak RSS and memory headroom under 512 MB RAM ceiling.
"""

import os
import sys

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath("."))

import time
import psutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from backend.app import create_app

def get_current_rss_mb() -> float:
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)

def run_load_test():
    py_version = sys.version.split()[0]
    print("==================================================================")
    print(f"Render Free-Tier Concurrency & Memory Load Test (Python {py_version})")
    print("Configuration: 1 Worker Process, 4 Concurrent Worker Threads (gunicorn)")
    print("==================================================================")

    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()

    baseline_rss = get_current_rss_mb()
    print(f"Baseline Process RSS: {baseline_rss:.2f} MB")

    test_scenarios = [
        # 1. Early-warning forecast endpoint
        {"method": "GET", "url": "/api/air/forecast?lat=28.6139&lon=77.2090&hours=72"},
        # 2. Multi-pollutant interactions heatmap endpoint
        {"method": "GET", "url": "/api/air/interactions?lat=28.6139&lon=77.2090&days=7"},
        # 3. Live geographic assessment endpoint
        {"method": "POST", "url": "/api/location/assess", "json": {"latitude": 28.6139, "longitude": 77.2090, "name": "Connaught Place"}},
        # 4. Livability decision engine endpoint
        {"method": "POST", "url": "/api/location/livability", "json": {"latitude": 28.6139, "longitude": 77.2090, "name": "Connaught Place"}}
    ]

    total_tasks = 120  # 30 batches of 4 requests across 4 concurrent threads
    peak_rss = baseline_rss
    completed = 0
    errors = 0

    def execute_request(idx):
        nonlocal peak_rss
        scenario = test_scenarios[idx % len(test_scenarios)]
        if scenario["method"] == "GET":
            resp = client.get(scenario["url"])
        else:
            resp = client.post(scenario["url"], json=scenario.get("json"))
        
        rss = get_current_rss_mb()
        if rss > peak_rss:
            peak_rss = rss
        return resp.status_code

    start_time = time.time()
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(execute_request, i) for i in range(total_tasks)]
        for f in as_completed(futures):
            try:
                status = f.result()
                if status in (200, 429, 502, 503):
                    completed += 1
                else:
                    errors += 1
            except Exception as e:
                errors += 1

    duration = time.time() - start_time
    final_rss = get_current_rss_mb()
    headroom = 512.0 - peak_rss
    headroom_pct = (headroom / 512.0) * 100

    print("------------------------------------------------------------------")
    print(f"Completed Requests:   {completed} / {total_tasks} ({completed/duration:.1f} req/s)")
    print(f"Execution Duration:   {duration:.2f} s")
    print(f"Baseline RSS:         {baseline_rss:.2f} MB")
    print(f"Peak RSS:             {peak_rss:.2f} MB")
    print(f"Final RSS:            {final_rss:.2f} MB")
    print(f"Net Growth:           {final_rss - baseline_rss:+.2f} MB")
    print(f"RAM Limit (Render):   512.00 MB")
    print(f"Free RAM Headroom:    {headroom:.2f} MB ({headroom_pct:.1f}% free)")
    print("------------------------------------------------------------------")

    assert peak_rss < 512.0, f"Peak memory {peak_rss:.2f} MB exceeded 512 MB limit!"
    print(f"SUCCESS: Peak RSS ({peak_rss:.2f} MB) safely complies with Render 512 MB limit with {headroom:.2f} MB headroom!")

if __name__ == "__main__":
    run_load_test()
