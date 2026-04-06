import { functions, FUNCTION_ID } from './appwriteConfig';
import { Client, Account, Databases, Functions } from 'appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // Your API Endpoint
    .setProject('69cbd0c14ee4ee5de252');           // Your Project ID

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export const FUNCTION_ID = '69cbbd96003c913626fb'; // Your Function ID