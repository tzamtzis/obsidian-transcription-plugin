/**
 * Test Utilities for Audio Transcription Plugin
 *
 * This file contains helper functions for testing the plugin.
 * Run with: node test-utils.js [command]
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
    log('\n' + '='.repeat(60), 'cyan');
    log(message, 'bright');
    log('='.repeat(60), 'cyan');
}

/**
 * Check if required tools are installed
 */
async function checkDependencies() {
    header('Checking Dependencies');

    const checks = [
        { name: 'Node.js', command: 'node --version' },
        { name: 'FFmpeg', command: 'ffmpeg -version' },
        { name: 'FFprobe', command: 'ffprobe -version' }
    ];

    let allPass = true;

    for (const check of checks) {
        try {
            const { stdout } = await execAsync(check.command);
            const version = stdout.split('\n')[0];
            log(`✅ ${check.name}: ${version}`, 'green');
        } catch (error) {
            log(`❌ ${check.name}: NOT FOUND`, 'red');
            allPass = false;
        }
    }

    if (!allPass) {
        log('\n⚠️  Some dependencies are missing. Please install them before testing.', 'yellow');
        return false;
    }

    log('\n✅ All dependencies are installed!', 'green');
    return true;
}

/**
 * Get audio file information
 */
async function getAudioInfo(filePath) {
    try {
        const { stdout } = await execAsync(
            `ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=codec_name,sample_rate,channels -of json "${filePath}"`
        );
        return JSON.parse(stdout);
    } catch (error) {
        log(`❌ Failed to get info for: ${filePath}`, 'red');
        log(error.message, 'red');
        return null;
    }
}

/**
 * Analyze audio file and display details
 */
async function analyzeAudioFile(filePath) {
    header(`Analyzing: ${path.basename(filePath)}`);

    if (!fs.existsSync(filePath)) {
        log(`❌ File not found: ${filePath}`, 'red');
        return;
    }

    const info = await getAudioInfo(filePath);
    if (!info) return;

    const duration = parseFloat(info.format.duration);
    const size = parseInt(info.format.size);
    const bitrate = parseInt(info.format.bit_rate);

    log(`File: ${path.basename(filePath)}`, 'bright');
    log(`Path: ${filePath}`);
    log(`Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
    log(`Duration: ${formatDuration(duration)}`);
    log(`Bitrate: ${(bitrate / 1000).toFixed(0)} kbps`);

    if (info.streams && info.streams.length > 0) {
        const stream = info.streams[0];
        log(`Codec: ${stream.codec_name}`);
        log(`Sample Rate: ${stream.sample_rate} Hz`);
        log(`Channels: ${stream.channels}`);

        // Warnings
        if (stream.sample_rate !== '16000') {
            log(`⚠️  Sample rate is not 16kHz (will be converted)`, 'yellow');
        }
        if (size > 100 * 1024 * 1024) {
            log(`⚠️  File is large (>100MB), processing may take significant time`, 'yellow');
        }
        if (duration > 7200) {
            log(`⚠️  File is very long (>2 hours), consider testing with smaller files first`, 'yellow');
        }
    }

    // Estimate processing time
    log('\nEstimated Processing Times:', 'cyan');
    const estimates = {
        'Cloud (OpenAI)': duration * 0.1,
        'Local (tiny)': duration * 0.15,
        'Local (base)': duration * 0.2,
        'Local (small)': duration * 0.35,
        'Local (medium)': duration * 0.5,
        'Local (large)': duration * 0.8
    };

    for (const [method, time] of Object.entries(estimates)) {
        log(`  ${method}: ${formatDuration(time)}`);
    }
}

/**
 * Batch analyze all audio files in a directory
 */
async function analyzeDirectory(dirPath) {
    header(`Analyzing Directory: ${dirPath}`);

    if (!fs.existsSync(dirPath)) {
        log(`❌ Directory not found: ${dirPath}`, 'red');
        return;
    }

    const audioExtensions = ['.m4a', '.mp3', '.wav', '.ogg', '.flac'];
    const files = fs.readdirSync(dirPath)
        .filter(file => audioExtensions.includes(path.extname(file).toLowerCase()))
        .map(file => path.join(dirPath, file));

    if (files.length === 0) {
        log('No audio files found in directory', 'yellow');
        return;
    }

    log(`Found ${files.length} audio file(s)\n`, 'green');

    for (const file of files) {
        await analyzeAudioFile(file);
        console.log('');
    }
}

/**
 * Create a test audio file using text-to-speech (if available)
 */
async function createTestAudio(text, outputPath) {
    header(`Creating Test Audio: ${outputPath}`);

    const platform = process.platform;

    try {
        if (platform === 'darwin') {
            // macOS: Use 'say' command
            await execAsync(`say "${text}" -o "${outputPath}"`);
            log(`✅ Created test audio: ${outputPath}`, 'green');
        } else if (platform === 'win32') {
            // Windows: Would need PowerShell script (complex)
            log(`⚠️  Automatic test audio creation not supported on Windows`, 'yellow');
            log(`Use Windows Speech SDK or record manually`, 'yellow');
        } else {
            // Linux: Would need espeak or festival
            log(`⚠️  Automatic test audio creation not supported on ${platform}`, 'yellow');
            log(`Install 'espeak' or 'festival' for TTS`, 'yellow');
        }
    } catch (error) {
        log(`❌ Failed to create test audio: ${error.message}`, 'red');
    }
}

/**
 * Validate transcription output
 */
async function validateOutput(markdownPath) {
    header(`Validating Output: ${path.basename(markdownPath)}`);

    if (!fs.existsSync(markdownPath)) {
        log(`❌ File not found: ${markdownPath}`, 'red');
        return;
    }

    const content = fs.readFileSync(markdownPath, 'utf8');
    const checks = [];

    // Check for required sections
    checks.push({
        name: 'Frontmatter',
        test: content.startsWith('---'),
        required: true
    });

    checks.push({
        name: 'Audio file metadata',
        test: content.includes('audio_file:'),
        required: true
    });

    checks.push({
        name: 'Duration metadata',
        test: content.includes('duration:'),
        required: true
    });

    checks.push({
        name: 'Language metadata',
        test: content.includes('language:'),
        required: true
    });

    checks.push({
        name: 'Summary section',
        test: content.includes('## Summary'),
        required: true
    });

    checks.push({
        name: 'Key Points section',
        test: content.includes('## Key Points'),
        required: true
    });

    checks.push({
        name: 'Full Transcription section',
        test: content.includes('## Full Transcription'),
        required: true
    });

    checks.push({
        name: 'Plugin footer',
        test: content.includes('Generated with Obsidian Audio Transcription Plugin'),
        required: true
    });

    checks.push({
        name: 'Action Items section',
        test: content.includes('## Action Items'),
        required: false
    });

    checks.push({
        name: 'Table of Contents',
        test: content.includes('## Table of Contents'),
        required: false
    });

    // Display results
    let passCount = 0;
    let requiredPassCount = 0;
    let requiredCount = 0;

    for (const check of checks) {
        const status = check.test ? '✅' : '❌';
        const statusColor = check.test ? 'green' : 'red';
        const req = check.required ? '[REQUIRED]' : '[OPTIONAL]';

        log(`${status} ${check.name} ${req}`, statusColor);

        if (check.test) passCount++;
        if (check.required) {
            requiredCount++;
            if (check.test) requiredPassCount++;
        }
    }

    log(`\nResults: ${passCount}/${checks.length} checks passed`, 'cyan');
    log(`Required: ${requiredPassCount}/${requiredCount} passed`, 'cyan');

    if (requiredPassCount === requiredCount) {
        log('\n✅ Output validation PASSED!', 'green');
        return true;
    } else {
        log('\n❌ Output validation FAILED!', 'red');
        return false;
    }
}

/**
 * Format duration in seconds to human readable
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

/**
 * Show usage help
 */
function showHelp() {
    log('\n' + '='.repeat(60), 'cyan');
    log('Audio Transcription Plugin - Test Utilities', 'bright');
    log('='.repeat(60), 'cyan');
    log('\nUsage: node test-utils.js [command] [args]', 'yellow');
    log('\nCommands:', 'cyan');
    log('  check-deps                    Check if required tools are installed');
    log('  analyze <file>                Analyze an audio file');
    log('  analyze-dir <directory>       Analyze all audio files in directory');
    log('  validate <markdown-file>      Validate transcription output');
    log('  create-test <text> <output>   Create test audio file (macOS only)');
    log('  help                          Show this help message');
    log('\nExamples:', 'cyan');
    log('  node test-utils.js check-deps');
    log('  node test-utils.js analyze audio-samples/test.m4a');
    log('  node test-utils.js analyze-dir audio-samples/');
    log('  node test-utils.js validate Transcriptions/test.md');
    log('  node test-utils.js create-test "Hello world" test.wav');
    log('');
}

// Main CLI handler
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === 'help') {
        showHelp();
        return;
    }

    switch (command) {
        case 'check-deps':
            await checkDependencies();
            break;

        case 'analyze':
            if (!args[1]) {
                log('❌ Please provide a file path', 'red');
                log('Usage: node test-utils.js analyze <file>', 'yellow');
                return;
            }
            await analyzeAudioFile(args[1]);
            break;

        case 'analyze-dir':
            if (!args[1]) {
                log('❌ Please provide a directory path', 'red');
                log('Usage: node test-utils.js analyze-dir <directory>', 'yellow');
                return;
            }
            await analyzeDirectory(args[1]);
            break;

        case 'validate':
            if (!args[1]) {
                log('❌ Please provide a markdown file path', 'red');
                log('Usage: node test-utils.js validate <markdown-file>', 'yellow');
                return;
            }
            await validateOutput(args[1]);
            break;

        case 'create-test':
            if (!args[1] || !args[2]) {
                log('❌ Please provide text and output path', 'red');
                log('Usage: node test-utils.js create-test "<text>" <output>', 'yellow');
                return;
            }
            await createTestAudio(args[1], args[2]);
            break;

        default:
            log(`❌ Unknown command: ${command}`, 'red');
            showHelp();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        log(`\n❌ Error: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = {
    checkDependencies,
    getAudioInfo,
    analyzeAudioFile,
    analyzeDirectory,
    validateOutput,
    formatDuration
};
