const os = require('os');
const fs = require('fs');

const GROUP = 'ББМО-01-23';
const LOG_FILE = 'monitor.log';

let warningCount = 0;

function getCpuSnapshot() {
    const cpus = os.cpus();

    let idle = 0;
    let total = 0;

    for (const cpu of cpus) {
        idle += cpu.times.idle;

        total +=
            cpu.times.user +
            cpu.times.nice +
            cpu.times.sys +
            cpu.times.idle +
            cpu.times.irq;
    }

    return {
        idle,
        total
    };
}

function calculateCpuUsage(previous, current) {
    const idleDiff = current.idle - previous.idle;
    const totalDiff = current.total - previous.total;

    if (totalDiff === 0) {
        return 0;
    }

    const busyDiff = totalDiff - idleDiff;

    return (busyDiff / totalDiff) * 100;
}

function getMemoryInfo() {
    const total = os.totalmem();
    const free = os.freemem();

    const freeGB = free / 1024 / 1024 / 1024;
    const usedPercent = ((total - free) / total) * 100;
    const freePercent = (free / total) * 100;

    return {
        freeGB,
        usedPercent,
        freePercent
    };
}

function logWarning(message) {
    const now = new Date();

    const date = now.toISOString()
        .replace('T', ' ')
        .substring(0, 19);

    const line =
        `[${date}] [${GROUP}] Предупреждение: ${message}\n`;

    fs.appendFileSync(LOG_FILE, line);

    warningCount++;
}

function getStatus(cpu, memory) {
    if (cpu > 80) {
        return '⚠⚠';
    }

    if (cpu > 50 || memory.freePercent < 10) {
        return '⚠';
    }

    return '';
}

function printInitialData() {
    const cpus = os.cpus();
    const memory = getMemoryInfo();

    const snapshot = {
        timestamp: new Date().toISOString(),
        group: GROUP,
        platform: os.platform(),
        type: os.type(),
        architecture: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        cpu: {
            model: cpus[0]?.model || 'Неизвестно',
            cores: cpus.length
        },
        memory: {
            totalGB: (
                os.totalmem() / 1024 / 1024 / 1024
            ).toFixed(2),
            freeGB: memory.freeGB.toFixed(2)
        }
    };

    console.log('=== Первичный сбор данных ===');
    console.log(JSON.stringify(snapshot, null, 2));
    console.log();
}

printInitialData();

console.log(
    `Мониторинг (группа ${GROUP}). Ctrl+C для выхода.`
);

let previousCpu = getCpuSnapshot();

const interval = setInterval(() => {
    const currentCpu = getCpuSnapshot();

    const cpuUsage = calculateCpuUsage(
        previousCpu,
        currentCpu
    );

    previousCpu = currentCpu;

    const memory = getMemoryInfo();

    const status = getStatus(cpuUsage, memory);

    if (cpuUsage > 80) {
        logWarning(
            `CPU ${cpuUsage.toFixed(1)}% — критическая нагрузка`
        );
    } else if (cpuUsage > 50) {
        logWarning(
            `CPU ${cpuUsage.toFixed(1)}% — повышенная нагрузка`
        );
    }

    if (memory.freePercent < 10) {
        logWarning(
            `Свободная память ${memory.freePercent.toFixed(1)}%`
        );
    }

    process.stdout.write(
        `\rCPU: ${cpuUsage.toFixed(1)}% | ` +
        `RAM: ${memory.usedPercent.toFixed(1)}% ` +
        `(${memory.freeGB.toFixed(2)} ГБ свободно) ${status}    `
    );
}, 2000);

process.on('SIGINT', () => {
    clearInterval(interval);

    console.log('\n');
    console.log(
        `Мониторинг остановлен. Предупреждений: ${warningCount}`
    );

    process.exit(0);
});