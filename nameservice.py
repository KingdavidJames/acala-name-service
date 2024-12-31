import logging
import os
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, ContextTypes, filters
from web3 import Web3
import asyncio
import time
import sqlite3

# Load environment variables
load_dotenv()

# Logging for debugging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# Connect to the AMB Testnet
web3 = Web3(Web3.HTTPProvider("https://network.ambrosus-test.io"))

# Check if connected to the testnet
if not web3.is_connected():
    raise Exception("Failed to connect to the AMB testnet.")

print("Connected to the AMB testnet")

# Load bot wallet from environment variables
BOT_PRIVATE_KEY = os.getenv("BOT_PRIVATE_KEY")
BOT_WALLET_ADDRESS = os.getenv("BOT_WALLET_ADDRESS")

if not BOT_PRIVATE_KEY or not BOT_WALLET_ADDRESS:
    raise Exception("Bot private key or wallet address not found! Set BOT_PRIVATE_KEY and BOT_WALLET_ADDRESS in the .env file.")

# Ensure the private key matches the provided wallet address
bot_wallet = web3.eth.account.from_key(BOT_PRIVATE_KEY)
if bot_wallet.address.lower() != BOT_WALLET_ADDRESS.lower():
    raise Exception("The private key does not match the provided wallet address.")

print(f"Bot Wallet Address: {BOT_WALLET_ADDRESS}")

# Gas price for testnet
gas_price = Web3.to_wei("1", "gwei")

# Mock database
name_service = {}  # Store name-to-wallet mappings
user_sessions = {}  # Store user session data


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Start the bot."""
    keyboard = [
        [InlineKeyboardButton("Create Name", callback_data="create_name")],
        [InlineKeyboardButton("Make Transfer", callback_data="make_transfer")],
        [InlineKeyboardButton("Decrypt Name", callback_data="decrypt_name")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        f"🌐 Welcome to the AirDAO Name Service Bot!\n\n"
        f"Secure your ANS (AirDAO Name Service) identity and handle AMB transactions seamlessly. 💰\n\n"
        "👇 Use the buttons below to proceed.",
        reply_markup=reply_markup,
        parse_mode="HTML",
    )


# Initialize the SQLite database
def init_db():
    conn = sqlite3.connect("nameservice.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS name_service (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            wallet_address TEXT NOT NULL,
            telegram_user_id INTEGER NOT NULL
        )
    """)
    conn.commit()
    conn.close()

# Save a new name entry
def save_name_to_db(name, wallet_address, telegram_user_id):
    conn = sqlite3.connect("nameservice.db")
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO name_service (name, wallet_address, telegram_user_id)
            VALUES (?, ?, ?)
        """, (name.lower(), wallet_address, telegram_user_id))
        conn.commit()
    except sqlite3.IntegrityError:
        raise Exception("Name already exists in the database.")
    finally:
        conn.close()

# Retrieve a name entry
def get_name_from_db(name):
    conn = sqlite3.connect("nameservice.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT wallet_address FROM name_service WHERE name = ?
    """, (name.lower(),))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None


async def create_name_prompt(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Start the name creation process."""
    await update.callback_query.answer()
    chat_id = update.callback_query.message.chat.id

    # Inform the user of the fee
    await update.callback_query.message.reply_text(
        "🪙 Ready to create your unique ANS name?\n\n"
        "⚡ Creating a name requires a FEE of 2 AMB."
    )

    # Delay before asking for the name
    await asyncio.sleep(2)

    # Prompt user to enter the name
    await context.bot.send_message(
        chat_id,
        "📜 Please type the name you want to create in the format `<name>.amb` (e.g., `alice.amb`).",
        parse_mode="Markdown",
    )

    # Save the chat ID for this session
    user_sessions[chat_id] = {"awaiting_name": True}


async def process_name_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Process the name input for creation."""
    chat_id = update.message.chat.id
    session = user_sessions.get(chat_id)

    # Ensure the session is awaiting name creation
    if not session or not session.get("awaiting_name"):
        await update.message.reply_text("I'm not waiting for a name to create. Please click the 'Create Name' button first.")
        return

    name = update.message.text.strip().lower()

    # Validate the name format
    if not name.endswith(".amb") or len(name.split(".")[0]) == 0:
        await update.message.reply_text("⚠️ Invalid name format. ANS names must end with `.amb` (e.g., `bob.amb`).\n"
        "🔁 Please try again.")
        return

    # Check if the name is already taken
    if get_name_from_db(name):  # Query the database for the name
        await update.message.reply_text("❌ The ANS name you entered is already taken. Please choose a different name to secure your spot on the blockchain. 🌐")
        return


    # Store the name in the user's session data
    session["requested_name"] = name
    session["awaiting_name"] = False

    # Prompt the user to pay the 2 AMB fee
    await update.message.reply_text(
        f"💳 To register the ANS `{name}`, please send 2 AMB to the bot wallet address:\n\n"
        f"<code>{BOT_WALLET_ADDRESS}</code>\n\n"
        "⏳  your name registration will be completed once funds is received. 🔒",
        parse_mode="HTML",
    )

    # Wait for the transaction confirmation
    await confirm_transaction(update, context, chat_id)
    # Clear the session after confirmation
    user_sessions.pop(chat_id, None)


async def decrypt_name_prompt(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Prompt the user to type a name to decrypt."""
    await update.callback_query.answer()
    chat_id = update.callback_query.message.chat.id

    # Prompt user to enter the name
    await context.bot.send_message(
        chat_id,
        "🔍 Want to find out which wallet is linked to an ANS?\n\n"
        "📜 Please type the ANS you'd like to decrypt (e.g., `alice.amb`).",
        parse_mode="Markdown",
    )

    # Save the chat ID for this session
    user_sessions[chat_id] = {"awaiting_decrypt": True}  # Ensure this is set


async def process_decrypt_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Process the name input for decryption."""
    chat_id = update.message.chat.id
    session = user_sessions.get(chat_id)

    # Ensure the session is awaiting decryption
    if not session or not session.get("awaiting_decrypt"):
        await update.message.reply_text("I'm not waiting for a name to decrypt. Please click the 'Decrypt Name' button first.")
        return

    name = update.message.text.strip().lower()

    # Validate the name format
    if not name.endswith(".amb") or len(name.split(".")[0]) == 0:
        await update.message.reply_text("⚠️ Invalid name format. ANS names must end with `.amb` (e.g., `bob.amb`).\n"
    "🔁 Please try again.")
        return

    # Indicate that the bot is checking the database
    await update.message.reply_text("Checking database...")

    # Simulate a delay (2 seconds) before responding
    await asyncio.sleep(2)

    # Check if the name exists in the name service
    wallet_address = get_name_from_db(name)
    if wallet_address:
        await update.message.reply_text(
            f"✅ The name `{name}` is linked🔗  to the wallet address:\n\n<code>{wallet_address}</code>",
            parse_mode="HTML",
        )
        await asyncio.sleep(2)
        await start(update, context)
    else:
        await update.message.reply_text(
            f"❓ The name `{name}` does not exist in the registry. 🧐\n\n"
            "Please double-check the name or try a different one.")

    # Clear the session data
    user_sessions.pop(chat_id, None)


async def confirm_transaction(update: Update, context: ContextTypes.DEFAULT_TYPE, chat_id: int) -> None:
    """Wait for the user to send the 2 AMB fee and confirm the transaction."""
    session = user_sessions.get(chat_id)
    fee_in_wei = Web3.to_wei(2, "ether")
    name = session.get("requested_name")

    # Wait up to 5 minutes for the payment
    start_time = time.time()
    sender_address = None

    while True:
        # Get the latest block
        latest_block = web3.eth.get_block("latest", full_transactions=True)

        # Check transactions in the block
        for tx in latest_block.transactions:
            if tx.to and tx.to.lower() == BOT_WALLET_ADDRESS.lower() and tx.value >= fee_in_wei:
                # Sender's wallet address
                sender_address = tx["from"]
                break

        # If a transaction is found, break out of the loop
        if sender_address:
            break

        # Timeout after 5 minutes
        if time.time() - start_time > 300:
            await update.message.reply_text("Transaction timed out. Please try again.")
            user_sessions.pop(chat_id, None)  # Clear session data
            await asyncio.sleep(2)
            await start(update, context)
            return

        await asyncio.sleep(5)  # Check every 5 seconds

    # Register the name
    try:
        telegram_user_id = update.message.chat.id
        save_name_to_db(name, sender_address, telegram_user_id)
        await update.message.reply_text(
            f"✅ The ANS `{name}` has been successfully created and linked to wallet `{sender_address}`.",
            parse_mode="Markdown",
        )
        user_sessions.pop(chat_id, None)  # Clear session data
        await asyncio.sleep(2)
        await start(update, context)
    except Exception as e:
        await update.message.reply_text(f"An error occurred: {str(e)}")
        await asyncio.sleep(4)
        await start(update, context)


async def process_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Route user input to the correct workflow."""
    chat_id = update.message.chat.id
    session = user_sessions.get(chat_id)

    # Route to the appropriate workflow based on session flags
    if session and session.get("awaiting_name"):
        await process_name_input(update, context)
    elif session and session.get("awaiting_decrypt"):
        await process_decrypt_input(update, context)
    elif session and session.get("awaiting_recipient"):
        await process_transfer_recipient(update, context)
    elif session and session.get("awaiting_amount"):
        await process_transfer_amount(update, context)
    else:
        await update.message.reply_text(
            "I'm not waiting for any input right now. Please choose an option from the menu."
        )

async def make_transfer_prompt(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Prompt the user to enter the recipient's ANS or wallet address."""
    await update.callback_query.answer()
    chat_id = update.callback_query.message.chat.id

    # Prompt user to enter the recipient address
    await context.bot.send_message(
        chat_id,
        "📜 Enter the recipient's ANS (e.g., `alice.amb`) or wallet address.",
        parse_mode="Markdown",
    )

    # Save the chat ID for this session
    user_sessions[chat_id] = {"awaiting_recipient": True}

async def process_transfer_recipient(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Process the recipient input for transfer."""
    chat_id = update.message.chat.id
    session = user_sessions.get(chat_id)

    if not session or not session.get("awaiting_recipient"):
        await update.message.reply_text("I'm not waiting for a recipient address. Please click the 'Make Transfer' button first.")
        return

    # Get the recipient input and normalize it
    recipient = update.message.text.strip().lower()
    session["recipient"] = None  # Default to None

    if recipient.endswith(".amb"):
        # Check if the ANS exists in the database
        wallet_address = get_name_from_db(recipient)
        if wallet_address:
            session["recipient"] = wallet_address
            await update.message.reply_text(f"✅ ....processing transafer to {recipient}.")
        else:
            await update.message.reply_text(f"❌ The ANS `{recipient}` does not exist in the registry. Please try again.")
            user_sessions.pop(chat_id, None)  # Clear session
            return
    elif web3.is_address(recipient):
        # Valid wallet address
        session["recipient"] = recipient
        await update.message.reply_text(f"✅ processing transfer to `{recipient}`.")
    else:
        # Invalid input
        await update.message.reply_text("❌ Invalid input. Please enter a valid ANS (e.g., `name.amb`) or wallet address.")
        return

    # Proceed to ask for the amount
    session["awaiting_recipient"] = False
    session["awaiting_amount"] = True
    await update.message.reply_text("💰  Enter the amount of AMB to transfer.")

async def process_transfer_amount(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Process the transfer amount."""
    chat_id = update.message.chat.id
    session = user_sessions.get(chat_id)

    if not session or not session.get("awaiting_amount"):
        await update.message.reply_text("I'm not waiting for an amount. Please click the 'Make Transfer' button first.")
        return

    try:
        # Get the amount in AMB and convert to wei
        amount_in_amb = float(update.message.text.strip())
        amount_in_wei = Web3.to_wei(amount_in_amb, "ether")
        session["amount_in_wei"] = amount_in_wei
        session["amount_in_amb"] = amount_in_amb
    except ValueError:
        await update.message.reply_text("⚠️ Invalid amount entered! Please provide a valid number of AMB. 💱")
        return

    session["awaiting_amount"] = False
    await update.message.reply_text(
        f"📥 To complete the transfer, send {amount_in_amb} AMB to the bot wallet address:\n\n"
        f"<code>{BOT_WALLET_ADDRESS}</code>\n\n"
        "⏳ recipient will be credited on receipt . 🔗",
        parse_mode="HTML",
    )

    # Monitor the bot's wallet for funds
    await monitor_and_forward(update, context, chat_id)

async def monitor_and_forward(update: Update, context: ContextTypes.DEFAULT_TYPE, chat_id: int) -> None:
    """Monitor the bot's wallet for funds and forward them to the recipient."""
    session = user_sessions.get(chat_id)
    recipient = session["recipient"]
    amount_in_wei = session["amount_in_wei"]
    amount_in_amb = session["amount_in_amb"]

    # Record the starting balance of the bot wallet
    starting_balance = web3.eth.get_balance(BOT_WALLET_ADDRESS)

    # Monitor for incoming transaction
    start_time = time.time()
    while True:
        # Get the current balance of the bot wallet
        current_balance = web3.eth.get_balance(BOT_WALLET_ADDRESS)

        # Check if the bot has received the expected amount
        if current_balance >= starting_balance + amount_in_wei:
            break

        if time.time() - start_time > 300:  # Timeout after 5 minutes
            await update.message.reply_text("⏳ The transfer session has timed out. 🕒\n\n"
            "🔁 Please try again when you're ready.")
            user_sessions.pop(chat_id, None)
            await asyncio.sleep(2)
            await start(update, context)
            return

        await asyncio.sleep(5)

    # Forward funds to the recipient
    try:
        nonce = web3.eth.get_transaction_count(BOT_WALLET_ADDRESS)  # Corrected method
        transaction = {
            "to": recipient,
            "value": amount_in_wei,
            "gas": 21000,
            "gasPrice": gas_price,
            "nonce": nonce,
        }
        signed_txn = web3.eth.account.sign_transaction(transaction, private_key=BOT_PRIVATE_KEY)
        txn_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)

        await update.message.reply_text(
            f"✅ The transfer of {amount_in_amb} AMB to `{recipient}` was successful! 🎉\n\n"
            f"📜 Transaction hash: <code>{txn_hash.hex()}</code>\n\n"
            "🔗 Your transaction is now live on the blockchain.",
            parse_mode="HTML",
        )
        await asyncio.sleep(2)
        await start(update, context)
    except Exception as e:
        await update.message.reply_text(
            f"⚠️ An error occurred during the transfer: {str(e)}.\n\n"
            "🔧 Please try again or contact support. @piedaddye")
        await asyncio.sleep(2)
        await start(update, context)
    finally:
        user_sessions.pop(chat_id, None)


def main() -> None:
    """Start the bot."""
    init_db()  # Initialize the database
    TOKEN = "7695527741:AAFxSLY6AHc91yuFy1DMQh_ZbFqJ1o8kY5c"  # Replace with your bot token
    application = Application.builder().token(TOKEN).build()

    # Register handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(create_name_prompt, pattern="create_name"))
    application.add_handler(CallbackQueryHandler(make_transfer_prompt, pattern="make_transfer"))
    application.add_handler(CallbackQueryHandler(decrypt_name_prompt, pattern="decrypt_name"))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, process_input))  # Single handler for text

    # Start the bot
    application.run_polling()


if __name__ == "__main__":
    main()
