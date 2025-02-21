// Suppress punycode deprecation warning secara paksa
process.removeAllListeners('warning');
process.on('warning', (warning) => {
    if (warning.code === 'DEP0040' && warning.name === 'DeprecationWarning') {
        return;
    }
    console.warn(warning);
});

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import cloudscraper from 'cloudscraper';
import readline from 'readline';
import winston from 'winston';
import cliProgress from 'cli-progress';
import Table from 'cli-table3';

// Banner
const banner = chalk.bold.magenta(`
╔════════════════════════════════════════════════╗
║      🚀 NAORIS PROTOCOL BOT - Automation       ║
║   Automate device monitoring & earnings!       ║
║   Secure API | Proxy Support | Auto Logging    ║
║   Developed by: https://t.me/sentineldiscus    ║
╚════════════════════════════════════════════════╝
`);

// Filter untuk menyembunyikan log tertentu di konsol
const consoleFilter = winston.format((info) => {
    const message = info.message;
    if (
        message.includes('Toggle state (ON) sending to backend') ||
        message.includes('Device Toggle Success') ||
        message.includes('Toggle state (ON) sent to backend') ||
        message.includes('Installed script executed successfully') ||
        message.includes('Message production initiated') ||
        message.includes('Heartbeat sent to backend') ||
        message.includes('Heartbeat Success') ||
        message.includes('Starting to fetch wallet details') ||
        message.includes('Response from walletDetails') ||
        message.includes('Raw response from walletDetails')
    ) {
        return false; // Jangan tampilkan di konsol
    }
    return info; // Tampilkan log lainnya
});

// Konfigurasi Winston Logger (hanya ke konsol, tanpa file)
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                consoleFilter(), // Terapkan filter hanya untuk konsol
                winston.format.printf(({ message }) => message) // Hapus timestamp dari konsol
            )
        })
        // Tidak ada transports.File lagi
    ]
});

class DeviceHeartbeatBot {
    constructor(account, proxyConfig = null) {
        this.account = account;
        this.proxyConfig = proxyConfig;
        this.baseUrls = {
            secApi: 'https://naorisprotocol.network/sec-api/api',
            testnetApi: 'https://naorisprotocol.network/testnet-api/api/testnet'
        };
        this.uptimeMinutes = 0;
        this.deviceHash = account.deviceHash;
        this.toggleState = true;
        this.whitelistedUrls = ["naorisprotocol.network", "google.com"];
        this.isInstalled = true;

        logger.info(proxyConfig
            ? chalk.blue(`[📡] Running with proxy: ${proxyConfig}`)
            : chalk.yellow(`[⚠️] Running without proxy`));
    }

    static async loadAccounts(configPath = path.join(process.cwd(), 'accounts.json')) {
        try {
            const configData = await fs.readFile(configPath, 'utf8');
            const accounts = JSON.parse(configData);
            logger.info(chalk.green(`Loaded ${accounts.length} accounts successfully`));
            return accounts;
        } catch (error) {
            logger.error(chalk.red(`Failed to load accounts: ${error.message}`));
            process.exit(1);
        }
    }

    static async loadProxies(proxyPath = path.join(process.cwd(), 'proxy.txt')) {
        try {
            const proxyData = await fs.readFile(proxyPath, 'utf8');
            const proxies = proxyData.split('\n').filter(line => line.trim());
            logger.info(chalk.green(`Loaded ${proxies.length} proxies successfully`));
            return proxies;
        } catch (error) {
            logger.error(chalk.red(`Failed to load proxies: ${error.message}`));
            return [];
        }
    }

    getRequestConfig() {
        return {
            headers: {
                'Authorization': `Bearer ${this.account.token}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                'Referer': this.baseUrls.secApi,
                'Content-Type': 'application/json'
            },
            ...(this.proxyConfig && { proxy: this.proxyConfig })
        };
    }

    async toggleDevice(state = "ON") {
        try {
            logger.info(chalk.cyan(`Toggle state (${state}) sending to backend...`));
            const payload = {
                walletAddress: this.account.walletAddress,
                state: state,
                deviceHash: this.deviceHash
            };

            const response = await cloudscraper.post(
                `${this.baseUrls.secApi}/toggle`,
                { json: payload, ...this.getRequestConfig() }
            );

            this.toggleState = state === "ON";
            this.logSuccess('Device Toggle', response);
            logger.info(chalk.cyan(`Toggle state (${state}) sent to backend.`));
        } catch (error) {
            this.logError('Toggle Error', error);
        }
    }

    async sendHeartbeat() {
        try {
            logger.info(chalk.cyan("Message production initiated"));
            const payload = {
                topic: 'device-heartbeat',
                inputData: {
                    walletAddress: this.account.walletAddress,
                    deviceHash: this.deviceHash.toString(),
                    isInstalled: this.isInstalled,
                    toggleState: this.toggleState,
                    whitelistedUrls: this.whitelistedUrls
                }
            };

            const response = await cloudscraper.post(
                `${this.baseUrls.secApi}/produce-to-kafka`,
                { json: payload, ...this.getRequestConfig() }
            );

            logger.info(chalk.cyan("Heartbeat sent to backend."));
            this.logSuccess('Heartbeat', response);
        } catch (error) {
            this.logError('Heartbeat Error', error);
        }
    }

    async getWalletDetails() {
        try {
            logger.info(chalk.cyan('Starting to fetch wallet details...'));
            const payload = { walletAddress: this.account.walletAddress };
            const bar = new cliProgress.SingleBar({
                format: chalk.cyan('Fetching Wallet Details |{bar}| {percentage}%'),
                barCompleteChar: '=',
                barIncompleteChar: '-'
            }, cliProgress.Presets.shades_classic);
            bar.start(100, 0);

            const response = await cloudscraper.post(
                `${this.baseUrls.testnetApi}/walletDetails`,
                { json: payload, ...this.getRequestConfig() }
            );

            bar.update(100);
            bar.stop();

            logger.info(chalk.yellow(`Response from walletDetails: ${JSON.stringify(response)}`));

            if (response && !response.error && response.details) {
                logger.info(chalk.green('Calling logWalletDetails with real data'));
                this.logWalletDetails(response.details);
            } else {
                logger.warn(chalk.yellow('No valid details received, showing dummy table'));
                this.logWalletDetails({
                    totalEarnings: 'N/A',
                    todayEarnings: 'N/A',
                    todayReferralEarnings: 'N/A',
                    todayUptimeEarnings: 'N/A',
                    activeRatePerMinute: 0,
                    rank: 'N/A'
                });
            }
        } catch (error) {
            logger.error(chalk.red(`Wallet Details Fetch Error: ${error.message}`));
            this.logError('Wallet Details Fetch', error);
            this.logWalletDetails({
                totalEarnings: 'Error',
                todayEarnings: 'Error',
                todayReferralEarnings: 'Error',
                todayUptimeEarnings: 'Error',
                activeRatePerMinute: 0,
                rank: 'Error'
            });
        }
    }

    async startHeartbeatCycle() {
        try {
            await this.toggleDevice("ON");
            logger.info(chalk.green("Installed script executed successfully!"));
            await this.sendHeartbeat();
            await this.getWalletDetails();

            let cycleCount = 0;
            const timer = setInterval(async () => {
                try {
                    cycleCount++;
                    this.uptimeMinutes++;

                    if (cycleCount % 5 === 0) {
                        logger.info(chalk.yellow("Service worker wake-up alarm triggered."));
                    }

                    if (!this.toggleState) {
                        await this.toggleDevice("ON");
                    }

                    await this.sendHeartbeat();
                    await this.getWalletDetails();
                    logger.info(chalk.green(`[${new Date().toLocaleTimeString()}] Minute ${this.uptimeMinutes} completed`));
                } catch (cycleError) {
                    logger.error(chalk.red("Heartbeat stopped."));
                    this.logError('Heartbeat Cycle', cycleError);
                    this.toggleState = false;
                }
            }, 60000);

            process.on('SIGINT', async () => {
                clearInterval(timer);
                await this.toggleDevice("OFF");
                logger.info(chalk.yellow(`\nBot stopped. Final uptime: ${this.uptimeMinutes} minutes`));
                process.exit();
            });
        } catch (error) {
            this.logError('Heartbeat Cycle Start', error);
        }
    }

    logSuccess(action, data) {
        logger.info(chalk.green(`[✔] ${action} Success: ${JSON.stringify(data)}`));
    }

    logError(action, error) {
        logger.error(chalk.red(`[✖] ${action} Error: ${error.message || error}`));
    }

    logWalletDetails(details) {
        const earnings = this.uptimeMinutes * (details.activeRatePerMinute || 0);
        const table = new Table({
            head: [chalk.cyan('Metric'), chalk.cyan('Value')],
            colWidths: [25, 40],
            style: { 'padding-left': 1, 'padding-right': 1 }
        });

        table.push(
            [chalk.white('Wallet Address'), this.account.walletAddress],
            [chalk.white('Total Earnings'), details.totalEarnings || 'N/A'],
            [chalk.white('Today\'s Earnings'), details.todayEarnings || 'N/A'],
            [chalk.white('Referral Earnings'), details.todayReferralEarnings || 'N/A'],
            [chalk.white('Uptime Earnings'), details.todayUptimeEarnings || 'N/A'],
            [chalk.white('Active Rate'), `${details.activeRatePerMinute || 0} per minute`],
            [chalk.white('Session Earnings'), earnings.toFixed(4)],
            [chalk.white('Uptime'), `${this.uptimeMinutes} minutes`],
            [chalk.white('Rank'), details.rank || 'N/A']
        );

        console.log(chalk.white('\n📊 Wallet Details:'));
        console.log(table.toString());
        console.log('\n');
        logger.info(chalk.green('Wallet details table displayed'));
    }
}

async function askForProxyUsage() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        console.log(chalk.cyan('\n=== Proxy Configuration ==='));
        console.log(chalk.white('Do you want to use proxies? (y/n)'));
        rl.question('> ', async (answer) => {
            rl.close();
            if (answer.toLowerCase() === 'y') {
                logger.warn(chalk.yellow('[⚠️] Warning: Using proxies may cause Cloudflare errors'));
                console.log(chalk.white('Press any key to continue...'));

                await new Promise(resolve => {
                    process.stdin.setRawMode(true);
                    process.stdin.resume();
                    process.stdin.once('data', () => {
                        process.stdin.setRawMode(false);
                        process.stdin.pause();
                        resolve();
                    });
                });

                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

async function main() {
    try {
        console.log(banner); // Tampilkan banner di awal
        const useProxy = await askForProxyUsage();
        const accounts = await DeviceHeartbeatBot.loadAccounts();

        let proxies = [];
        if (useProxy) {
            proxies = await DeviceHeartbeatBot.loadProxies();
            if (proxies.length === 0) {
                logger.warn(chalk.yellow('[⚠️] No proxies found in proxy.txt, running without proxy'));
            }
        }

        const bots = accounts.map((account, index) => {
            const proxy = proxies.length > 0 ? proxies[index % proxies.length] : null;
            return new DeviceHeartbeatBot(account, proxy);
        });

        for (const bot of bots) {
            bot.startHeartbeatCycle();
        }
    } catch (error) {
        logger.error(chalk.red(`Initialization Error: ${error.message}`));
    }
}

main();

export default DeviceHeartbeatBot;
