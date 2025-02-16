import { Client, Account, ID } from "appwrite";

// docs https://appwrite.io/docs/products/auth/quick-start

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    // .setProject('YOUR_PROJECT_ID');         
    .setProject('67b157e600336980e6ee'); 

const account = new Account(client);

export const authService = {
    // Sign up
    async signup(email, password) {
        try {
            return await account.create(
                ID.unique(), 
                email, 
                password
            );
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    },

    // Login
    async login(email, password) {
        try {
            return await account.createEmailPasswordSession(
                email, 
                password
            );
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    },

    // Logout
    async logout() {
        try {
            await account.deleteSession('current');
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    },

    // Check if user is logged in
    async checkAuth() {
        try {
            const user = await account.get();
            return user;
        } catch (error) {
            return null;
        }
    }
};