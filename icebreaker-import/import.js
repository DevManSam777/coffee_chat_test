import { Client, Databases, ID } from 'appwrite';
import { icebreakers } from './icebreakers.js';

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('67b157e600336980e6ee');         // Replace with your project ID

const databases = new Databases(client);

// Replace these with your existing database and collection IDs
// const DATABASE_ID = 'YOUR_DATABASE_ID';
const DATABASE_ID = '67b1582900033fb8f3b0';
// const COLLECTION_ID = 'YOUR_COLLECTION_ID';
const COLLECTION_ID = '67b1585b0038a4c4e142'


async function importQuestions() {
    const batchSize = 10;
    let imported = 0;

    try {
        for (let i = 0; i < icebreakers.length; i += batchSize) {
            const batch = icebreakers.slice(i, i + batchSize);
            const promises = batch.map(question => 
                databases.createDocument(
                    DATABASE_ID,
                    COLLECTION_ID,
                    ID.unique(),
                    question
                )
            );
            
            await Promise.all(promises);
            imported += batch.length;
            console.log(`Imported ${imported}/${icebreakers.length} questions`);
        }
        
        console.log('Successfully imported all questions!');
    } catch (error) {
        console.error('Error importing questions:', error);
        throw error;
    }
}

async function main() {
    try {
        console.log('Starting import to existing collection...');
        await importQuestions();
        console.log('Import complete!');
    } catch (error) {
        console.error('Import failed:', error);
    }
}

main();