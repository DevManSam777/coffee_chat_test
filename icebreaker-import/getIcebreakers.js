import { Client, Databases, Query } from 'appwrite';

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('67b157e600336980e6ee');

const databases = new Databases(client);

// Database and collection IDs
const DATABASE_ID = '67b1582900033fb8f3b0';
const COLLECTION_ID = '67b1585b0038a4c4e142';

// Function to get random numbers between min and max (inclusive)
function getRandomNumbers(min, max, count) {
    const numbers = new Set();
    while (numbers.size < count) {
        const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        numbers.add(randomNum);
    }
    return Array.from(numbers);
}

// Function to get 5 random icebreaker questions
async function getRandomQuestions() {
    try {
        // First, get the maximum QuestionID to know our range
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [
                Query.orderDesc('QuestionID'),
                Query.limit(1)
            ]
        );

        if (!response.documents.length) {
            throw new Error('No questions found in the database');
        }

        const maxQuestionID = response.documents[0].QuestionID;
        
        // Get 5 random QuestionIDs
        const randomIDs = getRandomNumbers(1, maxQuestionID, 5);
        
        // Fetch questions with these IDs in a single query
        const questions = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [
                Query.equal('QuestionID', randomIDs),
                Query.limit(5)
            ]
        );

        return questions.documents;
    } catch (error) {
        console.error('Error fetching random questions:', error);
        throw error;
    }
}

// Function to display the questions on the page
async function displayRandomQuestions() {
    const questionsList = document.getElementById('questions-list');
    const loadingElement = document.getElementById('loading');
    
    try {
        // Show loading state
        loadingElement.style.display = 'block';
        questionsList.innerHTML = '';
        
        const questions = await getRandomQuestions();
        
        // Hide loading state
        loadingElement.style.display = 'none';
        
        if (questions.length === 0) {
            questionsList.innerHTML = '<li class="error">No questions found</li>';
            return;
        }
        
        // Display questions
        questions.forEach(question => {
            const listItem = document.createElement('li');
            listItem.textContent = `${question.text || question.question}`;
            questionsList.appendChild(listItem);
        });
    } catch (error) {
        // Hide loading state and show error
        loadingElement.style.display = 'none';
        questionsList.innerHTML = `<li class="error">Failed to load questions: ${error.message}</li>`;
    }
}

// Add event listener for the refresh button
document.addEventListener('DOMContentLoaded', () => {
    const questionsList = document.getElementById('questions-list');
    const refreshButton = document.getElementById('refresh-button');
    
    // Set initial state
    questionsList.innerHTML = '<li>Click the button to load some coffee chat ice breaker questions!</li>';
    
    // Only add the click event listener
    refreshButton.addEventListener('click', displayRandomQuestions);
});