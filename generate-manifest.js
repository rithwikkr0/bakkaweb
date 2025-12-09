#!/usr/bin/env node

/**
 * generate-manifest.js
 * Auto-scans /public/assets/ and generates manifest.json
 * Run: node generate-manifest.js
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'public', 'assets');

function getDateFromFilename(filename) {
    const match = filename.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        return {
            date: `${match[1]}-${match[2]}-${match[3]}`,
            displayDate: new Date(`${match[1]}-${match[2]}-${match[3]}`).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };
    }
    return null;
}

function getFileMetadata(filepath, type) {
    const filename = path.basename(filepath);
    const dateInfo = getDateFromFilename(filename);

    if (!dateInfo) return null;

    return {
        path: filepath,
        date: dateInfo.date,
        displayDate: dateInfo.displayDate,
        type: type
    };
}

function scanDirectory(dir, type) {
    const items = [];

    try {
        if (!fs.existsSync(dir)) return items;

        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isFile()) {
                const metadata = getFileMetadata(fullPath, type);
                if (metadata) items.push(metadata);
            }
        });
    } catch (e) {
        console.warn(`Warning: Could not scan ${dir}: ${e.message}`);
    }

    return items.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getSongMetadata(filepath) {
    const filename = path.basename(filepath);

    // Extract title from filename (remove extension)
    const title = filename.replace(/\.[^/.]+$/, '');

    return {
        path: filepath,
        title: title,
        artist: 'Chintu ❤️',
        duration: 0, // Would need ID3 parsing for real duration
        useInMemories: false,
        useInSlideshow: false
    };
}

function scanSongs() {
    const dir = path.join(ASSETS_DIR, 'music');
    const songs = [];

    try {
        if (!fs.existsSync(dir)) return songs;

        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isFile() && (file.endsWith('.mp3') || file.endsWith('.wav'))) {
                const metadata = getSongMetadata(fullPath);
                songs.push(metadata);
            }
        });
    } catch (e) {
        console.warn(`Warning: Could not scan songs: ${e.message}`);
    }

    return songs;
}

function generateManifest() {
    console.log('🔍 Scanning assets...');

    const manifest = {
        memories: scanDirectory(path.join(ASSETS_DIR, 'photos', 'memories'), 'photo'),
        videos: scanDirectory(path.join(ASSETS_DIR, 'videos', 'memories'), 'video'),
        secretPhotos: scanDirectory(path.join(ASSETS_DIR, 'photos', 'secret'), 'secret_photo'),
        secretVideos: scanDirectory(path.join(ASSETS_DIR, 'videos', 'secret'), 'secret_video'),
        songs: scanSongs()
    };

    const output = path.join(__dirname, 'manifest.json');
    fs.writeFileSync(output, JSON.stringify(manifest, null, 2));

    console.log('✅ Manifest generated!');
    console.log(`📷 Memories: ${manifest.memories.length} files`);
    console.log(`🎥 Videos: ${manifest.videos.length} files`);
    console.log(`🔒 Secret Photos: ${manifest.secretPhotos.length} files`);
    console.log(`🔒 Secret Videos: ${manifest.secretVideos.length} files`);
    console.log(`🎵 Songs: ${manifest.songs.length} files`);
}

generateManifest();