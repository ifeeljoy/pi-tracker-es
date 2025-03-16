const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=usd&include_24hr_change=true';
const COINGECKO_API_DETAIL_URL = 'https://api.coingecko.com/api/v3/coins/pi-network';
const MINING_RATE = parseFloat(process.env.MINING_RATE);

// Slash command name and description
const commands = [
    new SlashCommandBuilder().setName('price').setDescription('Get the current price of Pi Network.'),
    new SlashCommandBuilder().setName('help').setDescription('Show the list of available commands.'),
    new SlashCommandBuilder().setName('ping').setDescription('Check bot latency.'),
    new SlashCommandBuilder().setName('mining').setDescription('Displays the current mining rates.'),
    new SlashCommandBuilder().setName('exchanges').setDescription('Get a list of verified exchanges where Pi is available.'),
    new SlashCommandBuilder().setName('wallet').setDescription('Check wallet balance by providing a wallet address.')
        .addStringOption(option =>
            option.setName('wallet')
                .setDescription('Wallet address to check balance for')
                .setRequired(true)),
    new SlashCommandBuilder().setName('fdv').setDescription('Get the Fully Diluted Valuation of Pi Network.'),
    new SlashCommandBuilder().setName('volume').setDescription('Get the 24-hour trading volume of Pi Network.'),
    new SlashCommandBuilder().setName('supply').setDescription('Get the supply details of Pi Network.')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
async function registerCommands() {
    try {
        console.log('Registering slash commands...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Slash commands registered successfully.');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
}

async function updateBotInfo() {
    try {
        const response = await axios.get(COINGECKO_API_URL);
        const data = response.data['pi-network'];

        if (!data) throw new Error('No data received from CoinGecko API');

        const price = data.usd;
        const change24h = data.usd_24h_change !== undefined ? data.usd_24h_change.toFixed(2) : 'N/A';
        const percentChange = data.usd_24h_change > 0 ? `+${change24h}%` : `${change24h}%`;

        console.log('API Response:', JSON.stringify(data, null, 2));
        console.log(`Price: ${price}, 24h Change: ${change24h}`);

        // Update bot's status
        client.user.setPresence({
            activities: [{ name: `Pi Network $${price} (${percentChange})`, type: ActivityType.Watching }],
            status: 'online'
        });

        // Update bot's bio
        await client.application.edit({
            description: `Pi: $${price} (${percentChange})`
        });

        console.log(`Updated status and bio: Price - $${price}, 24h Change - ${percentChange}`);
    } catch (error) {
        console.error('Failed to update bot information:', error.message);
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await registerCommands();
    updateBotInfo();
    setInterval(updateBotInfo, 60000); // Update status and bio every 60 seconds
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'price') {
        try {
            const response = await axios.get(COINGECKO_API_URL);
            const price = response.data['pi-network'].usd;
            const change24h = response.data['pi-network'].usd_24h_change !== undefined ? response.data['pi-network'].usd_24h_change.toFixed(2) : 'N/A';
            const percentChange = change24h > 0 ? `+${change24h}%` : `${change24h}%`;

            const embed = new EmbedBuilder()
                .setTitle('Pi Network Price')
                .setDescription(`The current price of Pi Network is **$${price} USD**. (**${percentChange}**)`)
                .setColor(0x4C2F71);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply('The bot is currently rate limited. Please try again in 1 minute.');
        }
    } else if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('Help Menu')
            .setDescription('`/price`, `/help`, `/ping`, `/mining`, `/exchanges`, `/fdv`, `/volume`, `/wallet`')
            .setColor(0x4C2F71);
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'ping') {
        const ping = Date.now() - interaction.createdTimestamp;
        const embed = new EmbedBuilder()
            .setTitle('Ping')
            .setDescription(`Pong! Latency is **${ping}ms** :ping_pong:.`)
            .setColor(0x4C2F71);
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'mining') {
        try {
            const response = await axios.get(COINGECKO_API_URL);
            const price = response.data['pi-network'].usd;
            const hoursToEarnOnePi = (1 / MINING_RATE).toFixed(2);
            const daysToEarnOnePi = (hoursToEarnOnePi / 24).toFixed(2);
            const hoursToEarnOneDollar = (1 / (price * MINING_RATE)).toFixed(2);
            const daysToEarnOneDollar = (hoursToEarnOneDollar / 24).toFixed(2);
            const embed = new EmbedBuilder()
                .setTitle('Mining Rate')
                .setDescription(`The current base rate for mining is **${MINING_RATE} π/hour**.\n≈ **${hoursToEarnOnePi} hours (${daysToEarnOnePi} days)** to earn 1 π.\n≈ **${hoursToEarnOneDollar} hours (${daysToEarnOneDollar} days)** to earn 1 USD.`)
                .setColor(0x4C2F71);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply('The bot is currently rate limited. Please try again in 1 minute.');
        }
    } else if (commandName === 'exchanges') {
        const embed = new EmbedBuilder()
            .setTitle('Pi Network Exchanges')
            .setDescription(`**Here is a list of exchanges where Pi is available:**
[OKX](https://www.okx.com/price/pi-network-pi)
[Bitget](https://www.bitget.com/price/pi-network)
[Gate.io](https://www.gate.io/price/pi-network-pi)
[Pionex](https://www.pionex.com/trade/PI_USDT)/[Pionex.us](https://www.pionex.us/trade/PI_USDT)
[MEXC](https://www.mexc.com/price/PI)

Only exchanges verified through [Pi Network's KYB](https://minepi.com/kyb-list/#VerifiedBusinesses) will be listed here.`)
            .setColor(0x4C2F71);
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'wallet') {
        const walletAddress = interaction.options.getString('wallet');
        try {
            const response = await axios.get(`https://api.mainnet.minepi.com/accounts/${walletAddress}`);
            const walletBalance = parseFloat(response.data.balances.find(balance => balance.asset_type === 'native').balance).toLocaleString();
            const embed = new EmbedBuilder()
                .setTitle('Wallet Balance')
                .setDescription(`The wallet balance for address ${walletAddress} is **${walletBalance} π**.`)
                .setColor(0x4C2F71);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply('Please provide a valid Pi Network wallet address.');
        }
    } else if (commandName === 'fdv') {
        try {
            const response = await axios.get(COINGECKO_API_DETAIL_URL);
            const fdv = response.data.market_data.fully_diluted_valuation.usd.toLocaleString();
            const embed = new EmbedBuilder()
                .setTitle('Fully Diluted Valuation')
                .setDescription(`The Fully Diluted Valuation (FDV) of Pi Network is **$${fdv} USD**.`)
                .setColor(0x4C2F71);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply('The bot is currently rate limited. Please try again in 1 minute.');
        }
    } else if (commandName === 'volume') {
        try {
            const response = await axios.get(COINGECKO_API_DETAIL_URL);
            const volume = response.data.market_data.total_volume.usd.toLocaleString();
            const embed = new EmbedBuilder()
                .setTitle('24-hour Trading Volume')
                .setDescription(`The 24-hour trading volume of Pi Network is **$${volume} USD**.`)
                .setColor(0x4C2F71);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply('The bot is currently rate limited. Please try again in 1 minute.');
        }
        }    else if (commandName === 'supply') {
    try {
        const response = await axios.get(COINGECKO_API_DETAIL_URL);
        const marketData = response.data.market_data;

        const circulatingSupply = marketData.circulating_supply;
        const totalSupply = marketData.total_supply;
        const maxSupply = marketData.max_supply;

                if (!circulatingSupply || !totalSupply || !maxSupply) {
            return await interaction.reply('Supply data is currently unavailable.');
        }

        const circulatingPercent = ((circulatingSupply / maxSupply) * 100).toFixed(2);
        const totalPercent = ((totalSupply / maxSupply) * 100).toFixed(2);

        const embed = new EmbedBuilder()
            .setTitle('Pi Network Supply')
            .setDescription(
                `**Circulating Supply:** ${circulatingSupply.toLocaleString()} π (${circulatingPercent}% of max)\n` +
                `**Total Supply:** ${totalSupply.toLocaleString()} π (${totalPercent}% of max)\n` +
                `**Max Supply:** ${maxSupply.toLocaleString()} π`
            )
            .setColor(0x4C2F71);

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        await interaction.reply('The bot is currently rate limited. Please try again in 1 minute.');
    }
});

client.login(process.env.BOT_TOKEN);