"""APScheduler — periodic data collection tasks."""

import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from config import settings
from agents.pipeline import run_pipeline

_scheduler: AsyncIOScheduler | None = None


async def collect_all():
    """Run collection for all enabled sources."""
    print(f"[Scheduler] Starting collection for: {settings.enabled_sources}")
    try:
        items = await run_pipeline()
        print(f"[Scheduler] Collection complete: {len(items)} items")
    except Exception as e:
        print(f"[Scheduler] Collection error: {e}")


async def start_scheduler():
    """Initialize and start the background scheduler."""
    global _scheduler
    if _scheduler is not None:
        return

    _scheduler = AsyncIOScheduler()

    # Schedule periodic collection
    _scheduler.add_job(
        collect_all,
        "interval",
        minutes=settings.collect_interval_minutes,
        id="collect_all",
        replace_existing=True,
    )

    # Also run once at startup
    _scheduler.add_job(
        collect_all,
        "date",
        run_date=None,  # run immediately when scheduler starts
        id="collect_all_startup",
    )

    _scheduler.start()
    print(f"[Scheduler] Started (interval={settings.collect_interval_minutes}min)")


async def stop_scheduler():
    """Shut down the scheduler gracefully."""
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        print("[Scheduler] Stopped")
