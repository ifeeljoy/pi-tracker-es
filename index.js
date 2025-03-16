const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=usd&include_24hr_change=true';
const COINGECKO_API_DETAIL_URL = 'https://api.coingecko.com/api/v3/coins/pi-network';
const MINING_RATE = parseFloat(process.env.TASA_DE_MINADO);

// Slash command name and description
const commands = [
    new SlashCommandBuilder().setName('precio').setDescription('Obtén el precio actual de Pi Network.'),
    new SlashCommandBuilder().setName('ayuda').setDescription('Muestra la lista de comandos disponibles.'),
    new SlashCommandBuilder().setName('ping').setDescription('Revisar la latencia del bot.'),
    new SlashCommandBuilder().setName('minar').setDescription('Muestra las tasas actuales de minado.'),
    new SlashCommandBuilder().setName('plataformas').setDescription('Obtén una lista de plataformas de trading donde Pi está disponible.'),
    new SlashCommandBuilder().setName('fdv').setDescription('Obtén la valoración totalmente diluida de Pi Network.'),
    new SlashCommandBuilder().setName('volumen').setDescription('Obtén el volumen de trading últimas 24 horas de Pi Network.'),
    new SlashCommandBuilder().setName('suministro').setDescription('Obtén los detalles del suministro de Pi Network.')
    ];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN_DEL_BOT);
async function registerCommands() {
    try {
        console.log('Registrando comandos de barra…');
        await rest.put(Routes.applicationCommands(process.env.ID_DEL_CLIENTE), { body: commands });
        console.log('Comandos de barra registrados exitosamente.');
    } catch (error) {
        console.error('Error al registrar los comandos de barra:', error);
    }
}

async function updateBotInfo() {
    try {
        const response = await axios.get(COINGECKO_API_URL);
        const data = response.data['pi-network'];

        if (!data) throw new Error('No se recibieron datos de la API de CoinGecko');

        const price = data.usd;
        const change24h = data.usd_24h_change !== undefined ? data.usd_24h_change.toFixed(2) : 'N/A';
        const percentChange = data.usd_24h_change > 0 ? `+${change24h}%` : `${change24h}%`;

        console.log('API Response:', JSON.stringify(data, null, 2));
        console.log(`Price: ${price}, 24h Change: ${change24h}`);

        // Actualizar el estado del bot
        client.user.setPresence({
            activities: [{ name: `Pi Network $${price} (${percentChange})`, type: ActivityType.Watching }],
            status: 'online'
        });

        // Actualizar la biografía del bot
        await client.application.edit({
            description: `Pi: $${price} (${percentChange})`
        });

        console.log(`Estado y biografía actualizados: Precio - $${price}, Cambio en 24h - ${percentChange}`);
    } catch (error) {
        console.error('Error al actualizar la información del bot:', error.message);
    }
}

client.once('ready', async () => {
    console.log(`Conectado como ${client.user.tag}`);
    await registerCommands();
    updateBotInfo();
    setInterval(updateBotInfo, 60000); // Actualizar estado y biografía cada 60 segundos
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'precio') {
        try {
            const response = await axios.get(COINGECKO_API_URL);
            const price = response.data['pi-network'].usd;
            const change24h = response.data['pi-network'].usd_24h_change !== undefined ? response.data['pi-network'].usd_24h_change.toFixed(2) : 'N/A';
            const percentChange = change24h > 0 ? `+${change24h}%` : `${change24h}%`;

            const embed = new EmbedBuilder()
                .setTitle('Precio de Pi Network')
                .setDescription(`El precio actual de Pi Network es **$${price} USD**. (**${percentChange}**)`)
                .setColor(0x4C2F71);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply('El bot está actualmente limitado por la tasa. Por favor, inténtalo de nuevo en 1 minuto.');
        }
    } else if (commandName === 'ayuda') {
        const embed = new EmbedBuilder()
            .setTitle('Comandos')
            .setDescription(`**Menú de ayuda:**
> **/precio** - Obtén el precio actual de Pi.
> **/ayuda** - Ver la lista de comandos disponibles.
> **/ping** - Verifica la latencia del bot.
> **/minar** - Obtén las tasas actuales de minado.
> **/plataformas** - Plataformas de trading (KYB) donde Pi está disponible.
> **/fdv** - Valoración totalmente diluida.
> **/volumen** - Volumen de trading últimas 24 horas.
> **/suministro** - Obtén información sobre el suministro de Pi Network.`)
            .setColor(0x4C2F71);
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'minar') {
        try {
            const response = await axios.get(COINGECKO_API_URL);
            const price = response.data['pi-network'].usd;
            const hoursToEarnOnePi = (1 / MINING_RATE).toFixed(2);
            const daysToEarnOnePi = (hoursToEarnOnePi / 24).toFixed(2);
            const hoursToEarnOneDollar = (1 / (price * MINING_RATE)).toFixed(2);
            const daysToEarnOneDollar = (hoursToEarnOneDollar / 24).toFixed(2);
            const embed = new EmbedBuilder()
                .setTitle('Tasa de Minado')
                .setDescription(`La tasa base para el minado es **${MINING_RATE} π/hora**.\n≈ **${hoursToEarnOnePi} horas (${daysToEarnOnePi} días)** para ganar 1 π.\n≈ **${hoursToEarnOneDollar} horas (${daysToEarnOneDollar} días)** para ganar $1.`)
                .setColor(0x4C2F71);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply('El bot está actualmente limitado por la tasa. Por favor, inténtalo de nuevo en 1 minuto.');
        }
        
    } else if (commandName === 'intercambios') {
        const embed = new EmbedBuilder()
            .setTitle('Plataformas de trading')
            .setDescription(`**Aquí tienes una lista de plataformas de trading donde Pi está disponible:**
[OKX](https://www.okx.com/price/pi-network-pi)
[Bitget](https://www.bitget.com/price/pi-network)
[Gate.io](https://www.gate.io/price/pi-network-pi)
[Pionex](https://www.pionex.com/trade/PI_USDT)/[Pionex.US](https://www.pionex.us/trade/PI_USDT)
[MEXC](https://www.mexc.com/price/PI)
            
Solo plataformas de trading verificados a través de [Pi Network's KYB](https://minepi.com/kyb-list/#VerifiedBusinesses) serán listados aquí.`)
            .setColor(0x4C2F71);
        await interaction.reply({ embeds: [embed] });
        
    } else if (commandName === 'fdv') {
        try {
            const response = await axios.get(COINGECKO_API_DETAIL_URL);
            const fdv = response.data.market_data.fully_diluted_valuation.usd.toLocaleString();
            const embed = new EmbedBuilder()
                .setTitle('Valoración totalmente diluida')
                .setDescription(`Valoración totalmente diluida (FDV) de Pi Network es **$${fdv} USD**.`)
                .setColor(0x4C2F71);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply('El bot está actualmente limitado por la tasa. Por favor, inténtalo de nuevo en 1 minuto.');
        }
    } else if (commandName === 'volumen') {
        try {
            const response = await axios.get(COINGECKO_API_DETAIL_URL);
            const volume = response.data.market_data.total_volume.usd.toLocaleString();
            const embed = new EmbedBuilder()
                .setTitle('Volumen de trading últimas 24 horas')
                .setDescription(`Volumen de trading últimas 24 horas de Pi Network es **$${volume} USD**.`)
                .setColor(0x4C2F71);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply('El bot está actualmente limitado por la tasa. Por favor, inténtalo de nuevo en 1 minuto.');
        }
     }    else if (commandName === 'suministro') {
    try {
        const response = await axios.get(COINGECKO_API_DETAIL_URL);
        const marketData = response.data.market_data;

        const circulatingSupply = marketData.circulating_supply;
        const totalSupply = marketData.total_supply;
        const maxSupply = marketData.max_supply;

        if (!circulatingSupply || !totalSupply || !maxSupply) {
            return await interaction.reply('Los datos del suministro no están disponibles en este momento.');
        }

        const circulatingPercent = ((circulatingSupply / maxSupply) * 100).toFixed(2);
        const totalPercent = ((totalSupply / maxSupply) * 100).toFixed(2);

        const embed = new EmbedBuilder()
            .setTitle('Suministro de Pi Network')
            .setDescription(
                `**Suministro circulante:** ${circulatingSupply.toLocaleString()} π (${circulatingPercent}% del máximo)\n` +
                `**Suministro total:** ${totalSupply.toLocaleString()} π (${totalPercent}% del máximo)\n` +
                `**Suministro máximo** ${maxSupply.toLocaleString()} π`
            )
            .setColor(0x4C2F71);

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        await interaction.reply('El bot está actualmente limitado por la tasa. Por favor, inténtalo de nuevo en 1 minuto.');
    }
     }
});

client.login(process.env.TOKEN_DEL_BOT);