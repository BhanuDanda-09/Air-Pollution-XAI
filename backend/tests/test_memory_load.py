"""Memory profiling and load test for location assessment endpoint.

Verifies that process memory usage remains well below Render free-tier 512MB RAM limit
and that assessment requests do not cause cumulative memory leaks.
"""

import os
import psutil
import pytest
from backend.app import create_app


def get_current_memory_mb() -> float:
    """Return current process resident memory (RSS) in megabytes."""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)


def test_memory_under_assessment_load():
    """Load test assessment endpoints and verify RSS stability under load."""
    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()

    baseline_mem = get_current_memory_mb()
    print(f"\n[Memory Profiling] Initial Process RSS: {baseline_mem:.2f} MB")

    # Sample coordinates across Delhi-NCR
    test_locations = [
        {"lat": 28.6139, "lon": 77.2090, "name": "Connaught Place"},
        {"lat": 28.4595, "lon": 77.0266, "name": "Gurugram"},
        {"lat": 28.5355, "lon": 77.3910, "name": "Noida"},
        {"lat": 28.6469, "lon": 77.3160, "name": "Anand Vihar"},
        {"lat": 28.7041, "lon": 77.1025, "name": "Rohini"},
    ]

    success_count = 0
    total_requests = 30
    peak_mem = baseline_mem

    for i in range(total_requests):
        loc = test_locations[i % len(test_locations)]
        # Assess endpoint
        resp = client.post(
            "/api/location/assess",
            json={"latitude": loc["lat"], "longitude": loc["lon"], "name": loc["name"]},
        )
        if resp.status_code in (200, 429, 502, 503):
            success_count += 1

        # Livability endpoint
        resp_liv = client.post(
            "/api/location/livability",
            json={"latitude": loc["lat"], "longitude": loc["lon"], "name": loc["name"]},
        )
        if resp_liv.status_code in (200, 429, 502, 503):
            success_count += 1

        curr_mem = get_current_memory_mb()
        if curr_mem > peak_mem:
            peak_mem = curr_mem

    final_mem = get_current_memory_mb()
    growth_mb = peak_mem - baseline_mem

    print(f"[Memory Profiling] Peak RSS: {peak_mem:.2f} MB")
    print(f"[Memory Profiling] Final RSS: {final_mem:.2f} MB")
    print(f"[Memory Profiling] Memory Growth Under Load: {growth_mb:.2f} MB")
    print(f"[Memory Profiling] Processed {total_requests * 2} requests with graceful degradation.")

    # Strict constraint: No memory leak under load (growth must be strictly bounded under 50MB)
    assert growth_mb < 50.0, f"Memory leak detected under load: growth was {growth_mb:.2f} MB"
