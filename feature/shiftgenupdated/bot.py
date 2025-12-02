import os
import discord
from discord.ext import commands, tasks
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
import pytz
import asyncio
import traceback

from core.postgres_db import PostgresDatabase
from core.name_mapper import NameMapper

# Load environment variables
load_dotenv()

# Bot setup
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix=".", intents=intents)

# Initialize database
try:
    db = PostgresDatabase(name_mapper=NameMapper())
except Exception as e:
    print(f"❌ Failed to initialize PostgreSQL database: {e}")
    print("Please ensure DATABASE_URL is set in your environment variables")
    exit(1)

# Store message IDs for editing
schedule_messages = {}  # Format: {channel_id: message_id}
current_war_messages = {}  # Format: {channel_id: message_id}

# Channel IDs
DAILY_SCHEDULE_CHANNEL_ID = None
CONSOLE_CHANNEL_ID = None  # Admin console for errors and monitoring
SHIFT_ALERT_CHANNEL_ID = None

# Manual date override (None = automatic mode)
MANUAL_SCHEDULE_DATE = None

# Track last refresh time for monitoring
last_refresh_time = None
last_refresh_success = True


async def log_to_console(message: str, level: str = "info"):
    """
    Log messages to console channel for admin visibility.

    Args:
        message: Message to log
        level: "info", "warning", "error", "success"
    """
    if not CONSOLE_CHANNEL_ID:
        return

    channel = bot.get_channel(CONSOLE_CHANNEL_ID)
    if not channel:
        return

    # Add emoji based on level
    emoji_map = {
        "info": "ℹ️",
        "warning": "⚠️",
        "error": "❌",
        "success": "✅"
    }
    emoji = emoji_map.get(level, "📝")

    # Format timestamp
    pst = pytz.timezone('America/Los_Angeles')
    now = datetime.now(pst)
    timestamp = now.strftime("%I:%M:%S %p")

    try:
        await channel.send(f"{emoji} **[{timestamp}]** {message}")
    except Exception as e:
        print(f"Failed to log to console: {e}")


def has_lead_scribe_or_admin():
    """Check if user has Lead Scribe role OR is administrator"""
    async def predicate(ctx):
        if not ctx.guild:
            return False

        # Check if user is administrator
        if ctx.author.guild_permissions.administrator:
            return True

        # Check if user has Lead Scribe role
        role = discord.utils.get(ctx.guild.roles, name="Lead Scribbler")
        if role and role in ctx.author.roles:
            return True

        return False
    return commands.check(predicate)


@bot.event
async def on_ready():
    print(f"Bot logged in as {bot.user}")
    print(f"Connected to {len(bot.guilds)} server(s)")

    # Check database connection
    try:
        count = db.get_record_count()
        print(f"✅ PostgreSQL connected: {count} records in database")
    except Exception as e:
        print(f"❌ PostgreSQL connection error: {e}")
        await log_to_console(f"Database connection error on startup: {e}", "error")

    # Start background tasks
    if not auto_update_current.is_running():
        auto_update_current.start()
        print("Started current shifts auto-update (every 10 minutes)")

    if not auto_refresh_schedule.is_running():
        auto_refresh_schedule.start()
        print("Started schedule auto-refresh (every 2 hours)")

    if not daily_backup.is_running():
        daily_backup.start()
        print("Started daily backup task")

    if not health_check.is_running():
        health_check.start()
        print("Started health check task (every 6 hours)")

    # Auto-refresh on startup if database is empty
    if db.is_empty():
        print("🔄 Database empty - running automatic refresh...")
        await log_to_console("Database empty on startup - running automatic refresh...", "warning")
        await perform_refresh_with_retry()


async def perform_refresh_with_retry(max_retries: int = 3, status_message=None) -> bool:
    """
    Perform database refresh with retry logic and console logging.

    Args:
        max_retries: Maximum number of retry attempts
        status_message: Optional Discord message to update with progress

    Returns:
        True if successful, False otherwise
    """
    global last_refresh_time, last_refresh_success

    from core.main import fetch_all_sites_schedules
    from core.scraper import ShiftGenScraper

    for attempt in range(max_retries):
        try:
            if status_message:
                await status_message.edit(content=f"🔄 Refresh attempt {attempt + 1}/{max_retries}...")

            await log_to_console(f"Starting refresh attempt {attempt + 1}/{max_retries}...", "info")

            scraper = ShiftGenScraper()

            # Attempt login
            if not scraper.login():
                error_msg = f"Login failed on attempt {attempt + 1}"
                await log_to_console(error_msg, "error")

                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt * 30  # 30s, 60s, 120s
                    await log_to_console(f"Retrying in {wait_time} seconds...", "warning")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    last_refresh_success = False
                    return False

            await log_to_console("Login successful - fetching schedules...", "info")

            # Fetch all data
            all_data = fetch_all_sites_schedules(scraper)

            if not all_data:
                error_msg = "No data fetched from ShiftGen"
                await log_to_console(error_msg, "error")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt * 30)
                    continue
                else:
                    last_refresh_success = False
                    return False

            # Detect changes before updating
            changes = db.compare_schedules(all_data)

            # Update database
            valid_count, invalid_count, invalid_records = db.update_data(all_data)

            # Automatically clean up any duplicates that might have been created
            duplicate_count = db.get_duplicate_count()
            if duplicate_count > 0:
                deleted_count = db.remove_duplicate_shifts()
                await log_to_console(f"Auto-cleanup: Removed {deleted_count} duplicate entries", "info")

            last_refresh_time = datetime.now(pytz.timezone('America/Los_Angeles'))
            last_refresh_success = True

            # Log results
            success_msg = f"Refresh complete: {valid_count} valid records"
            if invalid_count > 0:
                success_msg += f", {invalid_count} invalid records skipped"
            await log_to_console(success_msg, "success")

            # Log validation errors if any
            if invalid_records:
                for invalid in invalid_records[:5]:  # Log first 5
                    await log_to_console(
                        f"Validation error: {invalid['error']} - Record: {invalid['record']}",
                        "warning"
                    )

            # Post shift change alerts
            if changes and SHIFT_ALERT_CHANNEL_ID:
                await post_shift_alerts(changes)
                # Mark changes as alerted to prevent duplicates
                db.mark_changes_as_alerted(changes)
                await log_to_console(f"Posted {len(changes)} shift change alerts", "info")

            return True

        except Exception as e:
            error_msg = f"Refresh error on attempt {attempt + 1}: {str(e)}"
            await log_to_console(error_msg, "error")
            await log_to_console(f"Traceback: {traceback.format_exc()}", "error")

            if attempt < max_retries - 1:
                wait_time = 2 ** attempt * 30
                await log_to_console(f"Retrying in {wait_time} seconds...", "warning")
                await asyncio.sleep(wait_time)
            else:
                last_refresh_success = False
                return False

    return False


@bot.command(name="today")
@commands.cooldown(1, 10, commands.BucketType.user)
async def today(ctx):
    """Show today's schedule"""
    import pytz
    pst = pytz.timezone('America/Los_Angeles')
    now = datetime.now(pst)
    today_date = now.strftime("%Y-%m-%d")

    # Check if database is empty
    if db.is_empty():
        embed = discord.Embed(
            title="⚠️ Database Not Loaded",
            description=(
                "The schedule database hasn't been loaded yet.\n\n"
                "**This usually means:**\n"
                "• The bot just restarted\n"
                "• Automatic refresh is in progress (takes ~1 minute)\n\n"
                "**Try:**\n"
                "• Wait 60 seconds and try again\n"
                "• Contact a Lead Scribbler if this persists"
            ),
            color=0xFFA500
        )
        await ctx.send(embed=embed)
        return

    # Check date range
    min_date, max_date = db.get_date_range()
    if min_date and max_date:
        today_obj = datetime.strptime(today_date, "%Y-%m-%d")
        min_obj = datetime.strptime(min_date, "%Y-%m-%d")
        max_obj = datetime.strptime(max_date, "%Y-%m-%d")

        if today_obj.date() < min_obj.date() or today_obj.date() > max_obj.date():
            await ctx.send(
                f"⚠️ Today's date ({today_obj.strftime('%m/%d/%Y')}) is outside "
                f"the loaded schedule range ({min_obj.strftime('%m/%d')} - {max_obj.strftime('%m/%d')})\n"
                f"A Lead Scribbler can run `.refresh` to update the database."
            )
            return

    embed = db.format_daily_schedule_combined(today_date)
    await ctx.send(embed=embed)


@bot.command(name="tomorrow")
@commands.cooldown(1, 10, commands.BucketType.user)
async def tomorrow(ctx):
    """Show tomorrow's schedule"""
    import pytz
    pst = pytz.timezone('America/Los_Angeles')
    now = datetime.now(pst)
    tomorrow_date = (now + timedelta(days=1)).strftime("%Y-%m-%d")
    embed = db.format_daily_schedule_combined(tomorrow_date)
    await ctx.send(embed=embed)


@bot.command(name="current")
@commands.cooldown(1, 10, commands.BucketType.user)
async def current(ctx):
    """Show who's currently working (one-time, non-updating)"""
    embed = db.format_current_schedule()
    await ctx.send(embed=embed)


@bot.command(name="schedule")
@commands.cooldown(1, 10, commands.BucketType.user)
async def schedule(ctx, date_str: str = None):
    try:
        await ctx.message.delete()
    except:
        pass

    if not date_str:
        msg = await ctx.send("Please provide a date in MM-DD-YYYY format.\nExample: `.schedule 10-15-2025`")
        await asyncio.sleep(10)
        await msg.delete()
        return

    try:
        date_obj = datetime.strptime(date_str, "%m-%d-%Y")
        db_date = date_obj.strftime("%Y-%m-%d")
        embed = db.format_daily_schedule_combined(db_date)
        await ctx.send(embed=embed)
    except ValueError:
        msg = await ctx.send("Invalid date format. Please use MM-DD-YYYY.\nExample: `.schedule 10-15-2025`")
        await asyncio.sleep(10)
        await msg.delete()


@bot.command(name="setconsole")
@has_lead_scribe_or_admin()
async def setconsole(ctx):
    """Set the current channel as the admin console for monitoring and errors"""
    try:
        await ctx.message.delete()
    except:
        pass

    global CONSOLE_CHANNEL_ID
    CONSOLE_CHANNEL_ID = ctx.channel.id

    msg = await ctx.send(
        f"✅ **Console channel configured!**\n\n"
        f"This channel will now receive:\n"
        f"• Error messages and warnings\n"
        f"• Refresh status updates\n"
        f"• Health check reports\n"
        f"• Daily database backups\n"
        f"• Data validation errors"
    )

    await log_to_console("Console channel configured successfully", "success")
    await asyncio.sleep(10)
    await msg.delete()


@bot.command(name="setchannel")
@has_lead_scribe_or_admin()
async def setchannel(ctx):
    """Set daily schedule channel"""
    try:
        await ctx.message.delete()
    except:
        pass

    global DAILY_SCHEDULE_CHANNEL_ID
    DAILY_SCHEDULE_CHANNEL_ID = ctx.channel.id

    msg = await ctx.send(f"✅ Daily schedules will be posted in this channel.")
    await log_to_console(f"Daily schedule channel set to #{ctx.channel.name}", "info")
    await asyncio.sleep(5)
    await msg.delete()


@bot.command(name="setalertchannel")
@has_lead_scribe_or_admin()
async def setalertchannel(ctx):
    """Set the current channel for shift change alerts"""
    try:
        await ctx.message.delete()
    except:
        pass

    global SHIFT_ALERT_CHANNEL_ID
    SHIFT_ALERT_CHANNEL_ID = ctx.channel.id

    msg = await ctx.send(f"✅ Shift change alerts will be posted in this channel.")
    await log_to_console(f"Alert channel set to #{ctx.channel.name}", "info")
    await asyncio.sleep(5)
    await msg.delete()


@bot.command(name="refresh")
@has_lead_scribe_or_admin()
async def refresh(ctx):
    """Manually refresh schedule database from ShiftGen"""
    try:
        await ctx.message.delete()
    except:
        pass

    msg = await ctx.send("🔄 Refreshing schedule database... This may take a minute.")
    await log_to_console(f"Manual refresh initiated by {ctx.author.name}", "info")

    success = await perform_refresh_with_retry(max_retries=3, status_message=msg)

    if success:
        count = db.get_record_count()
        await msg.edit(content=f"✅ Database refreshed successfully! Total records: {count}")
    else:
        await msg.edit(content="❌ Failed to refresh database after 3 attempts. Check console channel for details.")

    await asyncio.sleep(10)
    await msg.delete()


@bot.command(name="postschedule")
@has_lead_scribe_or_admin()
async def postschedule(ctx):
    """Post auto-updating daily schedule"""
    try:
        await ctx.message.delete()
    except:
        pass

    if db.is_empty():
        error_msg = await ctx.send(
            "❌ **Database is empty!** Please run `.refresh` first to load schedule data."
        )
        await asyncio.sleep(10)
        await error_msg.delete()
        return

    try:
        global DAILY_SCHEDULE_CHANNEL_ID
        DAILY_SCHEDULE_CHANNEL_ID = ctx.channel.id

        relevant_date = get_relevant_schedule_date()

        # Verify there's data for this date
        shifts_for_date = db.get_shifts_for_date(relevant_date)
        if not shifts_for_date:
            date_obj = datetime.strptime(relevant_date, "%Y-%m-%d")
            error_msg = await ctx.send(
                f"⚠️ No shifts found for {date_obj.strftime('%A, %B %d, %Y')}.\n"
                f"Try `.refresh` to update the database."
            )
            await asyncio.sleep(10)
            await error_msg.delete()
            return

        embed = db.format_daily_schedule_combined(relevant_date)

        msg = await ctx.send(embed=embed)
        schedule_messages[ctx.channel.id] = msg.id

        confirmation = await ctx.send("✅ Schedule posted! Updates occur every 2 hours.")
        await log_to_console(f"Daily schedule posted in #{ctx.channel.name}", "success")
        await asyncio.sleep(5)
        await confirmation.delete()

    except Exception as e:
        error_msg = await ctx.send(
            f"❌ **Error posting schedule:** {str(e)}\n"
            f"Try running `.refresh` first, then try again."
        )
        await log_to_console(f"Error posting schedule: {e}", "error")
        await asyncio.sleep(15)
        await error_msg.delete()


@bot.command(name="postcurrent")
@has_lead_scribe_or_admin()
async def postcurrent(ctx):
    """Post auto-updating current shifts display"""
    try:
        await ctx.message.delete()
    except:
        pass

    if db.is_empty():
        error_msg = await ctx.send(
            "❌ **Database is empty!** Please run `.refresh` first to load schedule data."
        )
        await asyncio.sleep(10)
        await error_msg.delete()
        return

    try:
        embed = db.format_current_schedule()
        msg = await ctx.send(embed=embed)
        current_war_messages[ctx.channel.id] = msg.id

        confirmation = await ctx.send("✅ Current shifts posted! Updates every 10 minutes.")
        await log_to_console(f"Current shifts display posted in #{ctx.channel.name}", "success")
        await asyncio.sleep(5)
        await confirmation.delete()

    except Exception as e:
        error_msg = await ctx.send(
            f"❌ **Error posting current shifts:** {str(e)}"
        )
        await log_to_console(f"Error posting current shifts: {e}", "error")
        await asyncio.sleep(10)
        await error_msg.delete()


@bot.command(name="setup")
@has_lead_scribe_or_admin()
async def setup(ctx):
    """Complete setup: set channel, refresh database, post schedule and current shifts"""
    try:
        await ctx.message.delete()
    except:
        pass

    status_msg = await ctx.send("🔄 Running complete setup... This may take a minute.")
    await log_to_console(f"Setup initiated by {ctx.author.name}", "info")

    try:
        # Step 1: Set channel
        global DAILY_SCHEDULE_CHANNEL_ID
        DAILY_SCHEDULE_CHANNEL_ID = ctx.channel.id

        # Step 2: Refresh database
        await status_msg.edit(content="🔄 Refreshing database from ShiftGen...")
        success = await perform_refresh_with_retry(max_retries=3)

        if not success:
            await status_msg.edit(content="❌ Setup failed: Could not refresh database. Check console channel.")
            await asyncio.sleep(15)
            await status_msg.delete()
            return

        # Step 3: Post schedule
        await status_msg.edit(content="🔄 Posting schedules...")
        relevant_date = get_relevant_schedule_date()
        embed = db.format_daily_schedule_combined(relevant_date)

        schedule_msg = await ctx.send(embed=embed)
        schedule_messages[ctx.channel.id] = schedule_msg.id

        # Step 4: Post current shifts
        current_embed = db.format_current_schedule()
        current_msg = await ctx.send(embed=current_embed)
        current_war_messages[ctx.channel.id] = current_msg.id

        await status_msg.edit(content="✅ Setup complete! Both schedules posted and will auto-update.")
        await log_to_console("Setup completed successfully", "success")
        await asyncio.sleep(5)
        await status_msg.delete()

    except Exception as e:
        await status_msg.edit(content=f"❌ Setup failed: {str(e)}")
        await log_to_console(f"Setup error: {e}\n{traceback.format_exc()}", "error")
        await asyncio.sleep(15)
        await status_msg.delete()


def get_relevant_schedule_date():
    """Get the most relevant date to display based on current time or manual override"""
    global MANUAL_SCHEDULE_DATE

    if MANUAL_SCHEDULE_DATE:
        return MANUAL_SCHEDULE_DATE

    import pytz
    pst = pytz.timezone('America/Los_Angeles')
    now = datetime.now(pst)

    # After 8 PM, show tomorrow. Before 8 PM, show today
    if now.hour >= 20:
        relevant_date = now + timedelta(days=1)
    else:
        relevant_date = now

    return relevant_date.strftime("%Y-%m-%d")


@bot.command(name="setscheduledate")
@has_lead_scribe_or_admin()
async def setscheduledate(ctx, date_str: str = None):
    """Force the auto-updating schedule to show a specific date, or reset to auto mode"""
    try:
        await ctx.message.delete()
    except:
        pass

    global MANUAL_SCHEDULE_DATE

    if not date_str:
        # Reset to automatic mode
        MANUAL_SCHEDULE_DATE = None
        msg = await ctx.send("✅ Schedule reset to automatic mode")
    else:
        try:
            date_obj = datetime.strptime(date_str, "%m-%d-%Y")
            MANUAL_SCHEDULE_DATE = date_obj.strftime("%Y-%m-%d")
            msg = await ctx.send(
                f"✅ Schedule locked to **{date_obj.strftime('%A, %B %d, %Y')}**\n"
                f"💡 Use `.setscheduledate` (no date) to return to auto mode"
            )

            # Immediately update the schedule if one is posted
            if DAILY_SCHEDULE_CHANNEL_ID and DAILY_SCHEDULE_CHANNEL_ID in schedule_messages:
                channel = bot.get_channel(DAILY_SCHEDULE_CHANNEL_ID)
                if channel:
                    try:
                        message_id = schedule_messages[DAILY_SCHEDULE_CHANNEL_ID]
                        message = await channel.fetch_message(message_id)
                        embed = db.format_daily_schedule_combined(MANUAL_SCHEDULE_DATE)
                        await message.edit(embed=embed)
                    except:
                        pass
        except ValueError:
            msg = await ctx.send("❌ Invalid date format. Use **MM-DD-YYYY**\nExample: `.setscheduledate 10-07-2025`")

    await asyncio.sleep(10)
    await msg.delete()


@bot.command(name="updatenow")
@has_lead_scribe_or_admin()
async def updatenow(ctx):
    """Force immediate update of posted schedules"""
    try:
        await ctx.message.delete()
    except:
        pass

    msg = await ctx.send("🔄 Triggering manual update...")

    updated = []

    # Update schedule with smart date selection
    if DAILY_SCHEDULE_CHANNEL_ID and DAILY_SCHEDULE_CHANNEL_ID in schedule_messages:
        channel = bot.get_channel(DAILY_SCHEDULE_CHANNEL_ID)
        if channel:
            try:
                message_id = schedule_messages[DAILY_SCHEDULE_CHANNEL_ID]
                message = await channel.fetch_message(message_id)
                relevant_date = get_relevant_schedule_date()
                embed = db.format_daily_schedule_combined(relevant_date)

                await message.edit(embed=embed)
                date_obj = datetime.strptime(relevant_date, "%Y-%m-%d")
                updated.append(f"✅ Schedule updated (showing {date_obj.strftime('%A %m/%d')})")
            except Exception as e:
                updated.append(f"❌ Schedule update failed: {str(e)}")

    # Update current shifts
    for channel_id, message_id in list(current_war_messages.items()):
        channel = bot.get_channel(channel_id)
        if channel:
            try:
                message = await channel.fetch_message(message_id)
                embed = db.format_current_schedule()
                await message.edit(embed=embed)
                updated.append("✅ Current shifts updated")
            except Exception as e:
                updated.append(f"❌ Current shifts update failed: {str(e)}")

    if not updated:
        response = await ctx.send("⚠️ No active auto-updating messages found.")
    else:
        response = await ctx.send("\n".join(updated))

    await asyncio.sleep(5)
    await msg.delete()
    await response.delete()


async def post_shift_alerts(changes):
    """Post shift change alerts to the designated channel"""
    if not SHIFT_ALERT_CHANNEL_ID:
        return

    channel = bot.get_channel(SHIFT_ALERT_CHANNEL_ID)
    if not channel:
        return

    # Group changes by type
    added = [c for c in changes if c['type'] == 'added']
    removed = [c for c in changes if c['type'] == 'removed']
    modified = [c for c in changes if c['type'] == 'modified']

    if not (added or removed or modified):
        return

    embed = discord.Embed(
        title="🔔 Shift Change Alert",
        color=0xFFA500,  # Orange
        timestamp=datetime.utcnow()
    )

    # Format changes
    alert_lines = []

    for change in modified:
        old = change['old']
        new = change['new']
        date_obj = datetime.strptime(new['date'], "%Y-%m-%d")
        date_display = date_obj.strftime("%m/%d/%Y")
        alert_lines.append(
            f"**{new['site']}**: {old['person']} → **{new['person']}** "
            f"({date_display} {new['label']} {new['time']})"
        )

    for change in added:
        new = change['new']
        date_obj = datetime.strptime(new['date'], "%Y-%m-%d")
        date_display = date_obj.strftime("%m/%d/%Y")
        alert_lines.append(
            f"**{new['site']}**: **{new['person']}** added "
            f"({date_display} {new['label']} {new['time']})"
        )

    for change in removed:
        old = change['old']
        date_obj = datetime.strptime(old['date'], "%Y-%m-%d")
        date_display = date_obj.strftime("%m/%d/%Y")
        alert_lines.append(
            f"**{old['site']}**: {old['person']} removed "
            f"({date_display} {old['label']} {old['time']})"
        )

    if alert_lines:
        # Split into chunks if too long
        description = "\n".join(alert_lines)
        if len(description) > 4096:
            # Send multiple embeds if needed
            chunks = [alert_lines[i:i+10] for i in range(0, len(alert_lines), 10)]
            for i, chunk in enumerate(chunks):
                chunk_embed = discord.Embed(
                    title=f"🔔 Shift Change Alert ({i+1}/{len(chunks)})",
                    description="\n".join(chunk),
                    color=0xFFA500,
                    timestamp=datetime.utcnow()
                )
                await channel.send(embed=chunk_embed)
        else:
            embed.description = description
            embed.set_footer(text=f"Total changes: {len(changes)}")
            await channel.send(embed=embed)


@tasks.loop(hours=2)
async def auto_refresh_schedule():
    """Auto-refresh schedule every 2 hours"""
    await log_to_console("Starting scheduled refresh...", "info")
    success = await perform_refresh_with_retry(max_retries=3)

    if not success:
        await log_to_console("Scheduled refresh failed after all retries", "error")
        return

    # Update schedule message with smart date selection
    if DAILY_SCHEDULE_CHANNEL_ID and DAILY_SCHEDULE_CHANNEL_ID in schedule_messages:
        channel = bot.get_channel(DAILY_SCHEDULE_CHANNEL_ID)
        if channel:
            try:
                message_id = schedule_messages[DAILY_SCHEDULE_CHANNEL_ID]
                message = await channel.fetch_message(message_id)

                relevant_date = get_relevant_schedule_date()
                embed = db.format_daily_schedule_combined(relevant_date)

                await message.edit(embed=embed)
            except discord.NotFound:
                await log_to_console("Schedule message not found (may have been deleted)", "warning")
                del schedule_messages[DAILY_SCHEDULE_CHANNEL_ID]
            except Exception as e:
                await log_to_console(f"Error updating schedule message: {e}", "error")


@tasks.loop(minutes=10)
async def auto_update_current():
    """Auto-update current shifts display every 10 minutes"""
    for channel_id, message_id in list(current_war_messages.items()):
        channel = bot.get_channel(channel_id)
        if channel:
            try:
                message = await channel.fetch_message(message_id)
                embed = db.format_current_schedule()
                await message.edit(embed=embed)
            except discord.NotFound:
                await log_to_console(f"Current shifts message not found in channel {channel_id}", "warning")
                del current_war_messages[channel_id]
            except Exception as e:
                await log_to_console(f"Error updating current shifts: {e}", "error")


@tasks.loop(hours=24)
async def daily_backup():
    """Send daily database backup to console channel"""
    if not CONSOLE_CHANNEL_ID:
        return

    channel = bot.get_channel(CONSOLE_CHANNEL_ID)
    if not channel:
        return

    try:
        # Cleanup old alerted changes (keep 30 days)
        db.cleanup_old_alerted_changes(days_to_keep=30)

        # Get all shifts as CSV
        shifts = db.get_all_shifts()
        if not shifts:
            await log_to_console("Daily backup skipped: Database is empty", "warning")
            return

        # Create CSV content
        import csv
        import io

        output = io.StringIO()
        fieldnames = ['date', 'label', 'time', 'person', 'role', 'site']
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(shifts)

        # Convert to bytes
        csv_bytes = output.getvalue().encode('utf-8')
        file = discord.File(io.BytesIO(csv_bytes), filename=f"schedule_backup_{datetime.now().strftime('%Y%m%d')}.csv")

        count = len(shifts)
        min_date, max_date = db.get_date_range()

        embed = discord.Embed(
            title="📦 Daily Database Backup",
            description=f"**Records:** {count}\n**Date Range:** {min_date} to {max_date}",
            color=0x3498db,
            timestamp=datetime.utcnow()
        )

        await channel.send(embed=embed, file=file)
        await log_to_console(f"Daily backup completed: {count} records", "success")

    except Exception as e:
        await log_to_console(f"Daily backup failed: {e}", "error")


@tasks.loop(hours=6)
async def health_check():
    """Periodic health check reporting"""
    if not CONSOLE_CHANNEL_ID:
        return

    channel = bot.get_channel(CONSOLE_CHANNEL_ID)
    if not channel:
        return

    try:
        # Gather health metrics
        record_count = db.get_record_count()
        min_date, max_date = db.get_date_range()
        last_refresh = db.get_last_refresh_time()

        # Build health report
        embed = discord.Embed(
            title="🏥 Health Check Report",
            color=0x2ecc71 if last_refresh_success else 0xe74c3c,
            timestamp=datetime.utcnow()
        )

        embed.add_field(name="Database Status", value=f"{'✅ Connected' if record_count > 0 else '❌ Empty'}", inline=True)
        embed.add_field(name="Total Records", value=str(record_count), inline=True)
        embed.add_field(name="Last Refresh", value=last_refresh or "Never", inline=True)

        if min_date and max_date:
            embed.add_field(name="Date Range", value=f"{min_date} to {max_date}", inline=False)

        embed.add_field(
            name="Last Refresh Status",
            value="✅ Success" if last_refresh_success else "❌ Failed",
            inline=True
        )

        embed.add_field(name="Active Schedule Displays", value=str(len(schedule_messages)), inline=True)
        embed.add_field(name="Active Current Displays", value=str(len(current_war_messages)), inline=True)

        await channel.send(embed=embed)

    except Exception as e:
        await log_to_console(f"Health check failed: {e}", "error")


@auto_update_current.before_loop
async def before_auto_update_current():
    await bot.wait_until_ready()


@auto_refresh_schedule.before_loop
async def before_auto_refresh_schedule():
    await bot.wait_until_ready()


@daily_backup.before_loop
async def before_daily_backup():
    await bot.wait_until_ready()


@health_check.before_loop
async def before_health_check():
    await bot.wait_until_ready()


@bot.command(name="commands")
async def commands_list(ctx):
    """Show available user commands"""
    try:
        await ctx.message.delete()
    except:
        pass

    help_text = """
**Available Commands:**
`.today` - Show today's schedule
`.tomorrow` - Show tomorrow's schedule
`.current` - Show who's working right now
`.schedule MM-DD-YYYY` - Show schedule for specific date
`.commands` - Show this help message
    """
    msg = await ctx.send(help_text)
    await asyncio.sleep(30)
    await msg.delete()


@bot.command(name="cleanduplicates")
@has_lead_scribe_or_admin()
async def cleanduplicates(ctx):
    """Remove duplicate shift entries from the database"""
    try:
        await ctx.message.delete()
    except:
        pass

    msg = await ctx.send("🔍 Checking for duplicate entries...")
    await log_to_console(f"Duplicate cleanup initiated by {ctx.author.name}", "info")

    try:
        # First, check how many duplicates exist
        duplicate_count = db.get_duplicate_count()

        if duplicate_count == 0:
            await msg.edit(content="✅ No duplicate entries found! Database is clean.")
            await log_to_console("Duplicate check: No duplicates found", "success")
        else:
            await msg.edit(content=f"🔄 Found {duplicate_count} duplicate entries. Removing...")

            # Remove duplicates
            deleted_count = db.remove_duplicate_shifts()

            await msg.edit(
                content=f"✅ Database cleanup complete!\n"
                        f"Removed {deleted_count} duplicate entries.\n"
                        f"Your schedules should now display correctly."
            )
            await log_to_console(f"Removed {deleted_count} duplicate shift entries", "success")

    except Exception as e:
        await msg.edit(content=f"❌ Error during cleanup: {str(e)}")
        await log_to_console(f"Duplicate cleanup error: {e}", "error")

    await asyncio.sleep(15)
    await msg.delete()


def has_admin():
    """Check if user is a Discord server administrator (stricter than lead scribe check)"""
    async def predicate(ctx):
        if not ctx.guild:
            return False
        return ctx.author.guild_permissions.administrator
    return commands.check(predicate)


@bot.command(name="resetdb")
@has_admin()
async def resetdb(ctx):
    """Clear all shift entries and repopulate with fresh data from ShiftGen (ADMIN ONLY)"""
    try:
        await ctx.message.delete()
    except:
        pass

    # Confirmation message with warning
    warning_msg = await ctx.send(
        "⚠️ **DATABASE RESET WARNING** ⚠️\n\n"
        "This will **completely clear** all shift entries from the database "
        "and fetch fresh data from ShiftGen.\n\n"
        "React with ✅ to confirm, or ❌ to cancel.\n"
        "This message will auto-cancel in 30 seconds."
    )

    # Add reaction options
    await warning_msg.add_reaction("✅")
    await warning_msg.add_reaction("❌")

    def check(reaction, user):
        return (
            user == ctx.author
            and str(reaction.emoji) in ["✅", "❌"]
            and reaction.message.id == warning_msg.id
        )

    try:
        reaction, user = await bot.wait_for('reaction_add', timeout=30.0, check=check)

        if str(reaction.emoji) == "❌":
            await warning_msg.edit(content="❌ Database reset cancelled.")
            await log_to_console(f"Database reset cancelled by {ctx.author.name}", "info")
            await asyncio.sleep(5)
            await warning_msg.delete()
            return

    except asyncio.TimeoutError:
        await warning_msg.edit(content="⏱️ Database reset timed out (no confirmation).")
        await asyncio.sleep(5)
        await warning_msg.delete()
        return

    # User confirmed - proceed with reset
    await warning_msg.edit(content="🗑️ Clearing database...")
    await log_to_console(f"Database reset initiated by {ctx.author.name}", "warning")

    try:
        # Clear all shifts
        deleted_count = db.clear_all_shifts()
        await warning_msg.edit(content=f"✅ Cleared {deleted_count} shift entries.\n🔄 Fetching fresh data from ShiftGen...")
        await log_to_console(f"Cleared {deleted_count} shifts from database", "info")

        # Trigger a refresh to repopulate
        success = await perform_refresh_with_retry(status_message=warning_msg)

        if success:
            await warning_msg.edit(
                content=f"✅ **Database Reset Complete!**\n\n"
                        f"• Cleared {deleted_count} old entries\n"
                        f"• Fetched fresh data from ShiftGen\n"
                        f"• Database repopulated successfully\n\n"
                        f"Run `.updatenow` to refresh displayed schedules."
            )
            await log_to_console("Database reset completed successfully", "success")
        else:
            await warning_msg.edit(
                content="❌ Database was cleared but refresh failed.\n"
                        "Please run `.refresh` manually to repopulate the database."
            )
            await log_to_console("Database reset: Clear succeeded but refresh failed", "error")

    except Exception as e:
        await warning_msg.edit(content=f"❌ Database reset error: {str(e)}")
        await log_to_console(f"Database reset error: {e}", "error")
        await log_to_console(f"Traceback: {traceback.format_exc()}", "error")

    await asyncio.sleep(20)
    await warning_msg.delete()


@bot.command(name="devcommands")
@has_lead_scribe_or_admin()
async def devcommands(ctx):
    """Show available admin commands"""
    try:
        await ctx.message.delete()
    except:
        pass

    help_text = """
**Admin Commands:**
`.setup` - Run complete bot setup
`.setconsole` - Set admin console channel
`.setchannel` - Set daily schedule channel
`.setalertchannel` - Set shift change alert channel
`.postschedule` - Post auto-updating schedule
`.postcurrent` - Post auto-updating current shifts
`.updatenow` - Force update all displays
`.refresh` - Manually refresh database
`.cleanduplicates` - Remove duplicate shift entries
`.resetdb` - Clear database and repopulate with fresh data (ADMIN ONLY)
`.setscheduledate MM-DD-YYYY` - Lock schedule to specific date
    """
    msg = await ctx.send(help_text)
    await asyncio.sleep(30)
    await msg.delete()


# Error handling
@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandNotFound):
        msg = await ctx.send(f"❌ Command not found. Type `.commands` for available commands.")
        await asyncio.sleep(10)
        await msg.delete()
    elif isinstance(error, commands.MissingRequiredArgument):
        msg = await ctx.send(f"❌ Missing required argument. Type `.commands` for usage information.")
        await asyncio.sleep(10)
        await msg.delete()
    elif isinstance(error, commands.CommandOnCooldown):
        msg = await ctx.send(f"⏰ Please wait {error.retry_after:.0f} seconds before using this command again.")
        await asyncio.sleep(5)
        await msg.delete()
    elif isinstance(error, commands.CheckFailure):
        msg = await ctx.send("❌ You don't have permission to use this command.")
        await asyncio.sleep(10)
        await msg.delete()
    else:
        await log_to_console(f"Command error: {str(error)}\n{traceback.format_exc()}", "error")


# Run the bot
if __name__ == "__main__":
    TOKEN = os.getenv('DISCORD_BOT_TOKEN')
    if not TOKEN:
        print("ERROR: DISCORD_BOT_TOKEN not found in .env file")
    else:
        bot.run(TOKEN)
