import os
import discord
from discord.ext import commands, tasks
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
import pytz
import asyncio

from core.database import ConsolidatedDatabase
from core.name_mapper import NameMapper

# Load environment variables
load_dotenv()

# Bot setup
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix=".", intents=intents)

# Initialize database
db = ConsolidatedDatabase(name_mapper=NameMapper())

# Store message IDs for editing
schedule_messages = {}  # Format: {channel_id: message_id}
current_war_messages = {}  # Format: {channel_id: message_id}

# Channel ID for daily posts (set this to your desired channel)
DAILY_SCHEDULE_CHANNEL_ID = None  # Will be set after bot starts

# Manual date override (None = automatic mode)
MANUAL_SCHEDULE_DATE = None

# Channel ID for shift change alerts
SHIFT_ALERT_CHANNEL_ID = None  # Will be set with command

def has_role_by_name(role_name: str):
    """Check if user has a specific role by name"""
    async def predicate(ctx):
        if not ctx.guild:  # DMs don't have roles
            return False
        role = discord.utils.get(ctx.guild.roles, name=role_name)
        if role and role in ctx.author.roles:
            return True
        return False
    return commands.check(predicate)

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
    
    # Ensure output directory exists
    Path("schedule_outputs").mkdir(exist_ok=True)
    
    # Load existing database
    if Path("schedule_outputs/master_schedule.csv").exists():
        import csv
        with open("schedule_outputs/master_schedule.csv", 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            db.data = list(reader)
        print(f"✅ Loaded {len(db.data)} existing schedule records")
    else:
        print("⚠️  WARNING: No existing database found!")
        print("   Run .refresh or .setup command to initialize the database")
    
    if not auto_update_current.is_running():
        auto_update_current.start()
        print("Started current shifts auto-update (every 2 hours)")

    # Start the daily refresh task
    if not auto_refresh_schedule.is_running():
        auto_refresh_schedule.start()
        print("Refreshing schedule...")

    # Auto-refresh on startup if database is empty
    if not db.data:
        print("🔄 Database empty - running automatic refresh...")
        try:
            from core.main import fetch_all_sites_schedules
            from core.scraper import ShiftGenScraper
            
            scraper = ShiftGenScraper()
            if scraper.login():
                all_data = fetch_all_sites_schedules(scraper)
                total_records = db.update_data(all_data)
                db.save()
                print(f"✅ Auto-refresh complete: {total_records} records")
            else:
                print("❌ Auto-refresh failed: Could not login")
        except Exception as e:
            print(f"❌ Auto-refresh failed: {e}")

@bot.command(name="today")
async def today(ctx):
    """Show today's schedule"""
    import pytz
    pst = pytz.timezone('America/Los_Angeles')
    now = datetime.now(pst)
    today_date = now.strftime("%Y-%m-%d")
    embeds = db.format_daily_schedule(today_date)  # Multiple embeds
    for embed in embeds:
        await ctx.send(embed=embed)

@bot.command(name="tomorrow")
async def tomorrow(ctx):
    """Show tomorrow's schedule"""
    import pytz
    pst = pytz.timezone('America/Los_Angeles')
    now = datetime.now(pst)
    tomorrow_date = (now + timedelta(days=1)).strftime("%Y-%m-%d")
    embeds = db.format_daily_schedule(tomorrow_date)  # Multiple embeds
    for embed in embeds:
        await ctx.send(embed=embed)

def get_relevant_schedule_date():
    """Get the most relevant date to display based on current time or manual override"""
    global MANUAL_SCHEDULE_DATE
    
    # If manual date is set, use it
    if MANUAL_SCHEDULE_DATE:
        return MANUAL_SCHEDULE_DATE
    
    # Otherwise, use automatic logic
    import pytz
    pst = pytz.timezone('America/Los_Angeles')
    now = datetime.now(pst)
    
    # After 8 PM, show tomorrow. Before 8 PM, show today
    if now.hour >= 20:
        relevant_date = now + timedelta(days=1)
    else:
        relevant_date = now
    
    return relevant_date.strftime("%Y-%m-%d")

def get_schedule_mode_description():
    """Get a description of what schedule is being shown and why"""
    global MANUAL_SCHEDULE_DATE
    
    if MANUAL_SCHEDULE_DATE:
        date_obj = datetime.strptime(MANUAL_SCHEDULE_DATE, "%Y-%m-%d")
        return f"Custom • Showing {date_obj.strftime('%A %m/%d')}"
    return ""  # Add this line

@bot.command(name="postschedule")
@has_lead_scribe_or_admin()
async def postschedule(ctx):
    try:
        await ctx.message.delete()
    except:
        pass
    
    # Check if database has data
    if not db.data:
        error_msg = await ctx.send(
            "❌ **Database is empty!** Please run `.refresh` first to load schedule data.\n"
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
        await asyncio.sleep(5)
        await confirmation.delete()
        
    except Exception as e:
        error_msg = await ctx.send(
            f"❌ **Error posting schedule:** {str(e)}\n"
            f"Try running `.refresh` first, then try again."
        )
        print(f"Error in postschedule: {e}")
        await asyncio.sleep(15)
        await error_msg.delete()

@bot.command(name="setscheduledate")
@has_lead_scribe_or_admin()
async def setscheduledate(ctx, date_str: str = "Last Updated"):
    """Force the auto-updating schedule to show a specific date, or reset to auto mode"""
    try:
        await ctx.message.delete()
    except:
        pass
    
    global MANUAL_SCHEDULE_DATE
    
    if not date_str:
        # Reset to automatic mode
        MANUAL_SCHEDULE_DATE = None

    else:
        try:
            date_obj = datetime.strptime(date_str, "%m-%d-%Y")
            MANUAL_SCHEDULE_DATE = date_obj.strftime("%Y-%m-%d")
            msg = await ctx.send(f"✅ Schedule locked to **{date_obj.strftime('%A, %B %d, %Y')}**\n💡 Use `.setscheduledate` (no date) to return to auto mode")
            
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
    # Refresh database using temporary instance
    try:
        from core.main import fetch_all_sites_schedules
        from core.scraper import ShiftGenScraper
        
        scraper = ShiftGenScraper()
        if scraper.login():
            all_data = fetch_all_sites_schedules(scraper)
            
            # Detect changes before updating
            changes = db.compare_schedules(all_data)
            
            # Update the database
            total_records = db.update_data(all_data)
            db.save()
            print(f"Database refreshed! Total records: {total_records}")
            
            # Post alerts if there are changes and channel is set
            if changes and SHIFT_ALERT_CHANNEL_ID:
                await post_shift_alerts(changes)
        else:
            print("Failed to login during auto-refresh")
            return
    except Exception as e:
        print(f"Error during auto-refresh: {e}")
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
                print("Schedule message not found")
                del schedule_messages[DAILY_SCHEDULE_CHANNEL_ID]
            except Exception as e:
                print(f"Error updating schedule message: {e}")

@bot.command(name="postcurrent")
@has_lead_scribe_or_admin()
async def postcurrent(ctx):
    try:
        await ctx.message.delete()
    except:
        pass
    
    # Check if database has data
    if not db.data:
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
        await asyncio.sleep(5)
        await confirmation.delete()
        
    except Exception as e:
        error_msg = await ctx.send(
            f"❌ **Error posting current shifts:** {str(e)}"
        )
        print(f"Error in postcurrent: {e}")
        await asyncio.sleep(10)
        await error_msg.delete()

@tasks.loop(minutes=10)
async def auto_update_current():
    for channel_id, message_id in list(current_war_messages.items()):
        channel = bot.get_channel(channel_id)
        if channel:
            try:
                message = await channel.fetch_message(message_id)
                embed = db.format_current_schedule()
                await message.edit(embed=embed)
                print(f"Updated current shifts in channel {channel.name}")
            except discord.NotFound:
                print(f"Current shifts message not found in channel {channel_id}")
                del current_war_messages[channel_id]
            except Exception as e:
                print(f"Error updating current shifts: {e}")

@auto_update_current.before_loop
async def before_auto_update_current():
    await bot.wait_until_ready()
    

@bot.command(name="schedule")
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
        embeds = db.format_daily_schedule(db_date)
        for embed in embeds:
            await ctx.send(embed=embed)
    except ValueError:
        msg = await ctx.send("Invalid date format. Please use MM-DD-YYYY.\nExample: `.schedule 10-15-2025`")
        await asyncio.sleep(10)
        await msg.delete() 

@bot.command(name="setchannel")
@has_lead_scribe_or_admin()
async def setchannel(ctx):
    try:
        await ctx.message.delete()
    except:
        pass
    
    global DAILY_SCHEDULE_CHANNEL_ID
    DAILY_SCHEDULE_CHANNEL_ID = ctx.channel.id
    
    msg = await ctx.send(f"Daily schedules will be posted in this channel.")
    await asyncio.sleep(5)
    await msg.delete()


@bot.command(name="refresh")
@has_lead_scribe_or_admin()
async def refresh(ctx):
    # Delete the command message
    try:
        await ctx.message.delete()
    except:
        pass
    
    msg = await ctx.send("Refreshing schedule database... This may take a minute.")
    
    try:
        from core.main import fetch_all_sites_schedules
        from core.scraper import ShiftGenScraper
        
        scraper = ShiftGenScraper()
        if not scraper.login():
            response = await ctx.send("Failed to login to ShiftGen.")
            await asyncio.sleep(5)
            await msg.delete()
            await response.delete()
            return
        
        all_data = fetch_all_sites_schedules(scraper)
        total_records = db.update_data(all_data)
        db.save()
        
        response = await ctx.send(f"Database refreshed! Total records: {total_records}")
        
        # Delete status messages after 5 seconds
        await asyncio.sleep(5)
        await msg.delete()
        await response.delete()
    except Exception as e:
        response = await ctx.send(f"Error refreshing database: {str(e)}")
        await asyncio.sleep(5)
        await msg.delete()
        await response.delete()

@bot.command(name="setup")
@has_lead_scribe_or_admin()
async def setup(ctx):
    """Complete setup: set channel, refresh database, post schedule and current shifts"""
    try:
        await ctx.message.delete()
    except:
        pass
    
    status_msg = await ctx.send("🔄 Running complete setup... This may take a minute.")
    
    try:
        # Step 1: Set channel
        global DAILY_SCHEDULE_CHANNEL_ID
        DAILY_SCHEDULE_CHANNEL_ID = ctx.channel.id
        
        # Step 2: Refresh database
        from core.main import fetch_all_sites_schedules
        from core.scraper import ShiftGenScraper
        
        scraper = ShiftGenScraper()
        if not scraper.login():
            await status_msg.edit(content="❌ Failed to login to ShiftGen. Check credentials.")
            await asyncio.sleep(10)
            await status_msg.delete()
            return
        
        await status_msg.edit(content="🔄 Fetching schedules from ShiftGen...")
        all_data = fetch_all_sites_schedules(scraper)
        total_records = db.update_data(all_data)
        db.save()

        # Step 3: Post schedule  
        relevant_date = get_relevant_schedule_date()
        embed = db.format_daily_schedule_combined(relevant_date)
        
        schedule_msg = await ctx.send(embed=embed)
        schedule_messages[ctx.channel.id] = schedule_msg.id
        
        # Step 4: Post current shifts
        current_embed = db.format_current_schedule()
        current_msg = await ctx.send(embed=current_embed)
        current_war_messages[ctx.channel.id] = current_msg.id
        
        await status_msg.edit(content="✅ Setup complete! Both schedules posted and will auto-update.")
        await asyncio.sleep(5)
        await status_msg.delete()
   
    except Exception as e:
        await status_msg.edit(content=f"❌ Setup failed: {str(e)}")
        print(f"Error in setup: {e}")
        await asyncio.sleep(15)
        await status_msg.delete()

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
    await asyncio.sleep(5)
    await msg.delete()

@bot.command(name="updatenow")
@has_lead_scribe_or_admin()
async def updatenow(ctx):
    try:
        await ctx.message.delete()
    except:
        pass
    
    msg = await ctx.send("Triggering manual update...")
    
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
        response = await ctx.send("No active auto-updating messages found.")
    else:
        response = await ctx.send("\n".join(updated))
    
    await asyncio.sleep(5)
    await msg.delete()
    await response.delete()

@bot.command(name="current")
async def current(ctx):
    """Show who's currently working (one-time, non-updating)"""
    embed = db.format_current_schedule()
    await ctx.send(embed=embed)

@bot.command(name="commands")
async def commands_list(ctx):
    try:
        await ctx.message.delete()
    except:
        pass
    
    help_text = """
**Available Commands:**
`.today` - Show today's schedule 
`.tomorrow` - Show tomorrow's schedule
`.current` - Show who's working right now
`.commands` - Show this help message
`.schedule MM-DD-YYYY` - Show the schedule for a specific date
    """
    msg = await ctx.send(help_text)
    await asyncio.sleep(30)
    await msg.delete()

@bot.command(name="devcommands")
async def commands_list(ctx):
    try:
        await ctx.message.delete()
    except:
        pass
    
    help_text = """
**Dev Commands:**
`.setup` - Run the default bot setup
`.setchannel` - Sets the primary schedule channel
`.postschedule` - Posts schedule bulletin
`.postcurrent` - Posts live scribes
`.updatenow` - Updates schedule/current to current time
`.refresh` - Refreshes the master database

    """
    msg = await ctx.send(help_text)
    await asyncio.sleep(30)
    await msg.delete()

# Error handling
@refresh.error
async def refresh_error(ctx, error):
    if isinstance(error, commands.MissingPermissions):
        await ctx.send("You need administrator priviliges to refresh the database.")

@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandNotFound):
        await ctx.send(f"Command not found. Type `.commands` for available commands.")
    elif isinstance(error, commands.MissingRequiredArgument):
        await ctx.send(f"Missing required argument. Type `.commands` for usage information.")

# Run the bot
if __name__ == "__main__":
    TOKEN = os.getenv('DISCORD_BOT_TOKEN')
    if not TOKEN:
        print("ERROR: DISCORD_BOT_TOKEN not found in .env file")
    else:
        bot.run(TOKEN)