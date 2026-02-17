
import fs from 'fs';
import path from 'path';

// Read the JSON database
const dbPath = path.join(process.cwd(), 'ps1_complete_database.json');
const dbContent = fs.readFileSync(dbPath, 'utf-8');
const games = JSON.parse(dbContent);

const missingCovers: string[] = [];
let totalGames = 0;
let gamesWithCovers = 0;

console.log('Checking cover existence...');

games.forEach((game: any) => {
    totalGames++;
    if (game.cover_path) {
        // The path in JSON is relative properly e.g. "ps1_covers/U/..."
        const publicPath = path.join(process.cwd(), 'public', game.cover_path);

        // Check if file exists
        if (!fs.existsSync(publicPath)) {
            // Check if it's the specific pattern mentioned in logs (URL encoded vs file system)
            // The logs show %20, fs check might need decoding if the filename on disk has spaces
            // But usually raw string from JSON should match filename on disk

            // Try decoding just in case
            const decodedPath = decodeURIComponent(publicPath);
            if (!fs.existsSync(decodedPath)) {
                missingCovers.push(`${game.title} (${game.serial}): ${game.cover_path}`);
            }
        } else {
            gamesWithCovers++;
        }
    }
});

console.log(`Total Games: ${totalGames}`);
console.log(`Games with existing covers: ${gamesWithCovers}`);
console.log(`Missing Covers: ${missingCovers.length}`);

if (missingCovers.length > 0) {
    console.log('\n--- Missing Covers ---');
    missingCovers.forEach(c => console.log(c));

    // Save to a file for the user
    fs.writeFileSync('missing_covers.txt', missingCovers.join('\n'));
    console.log('\nList saved to missing_covers.txt');
}
