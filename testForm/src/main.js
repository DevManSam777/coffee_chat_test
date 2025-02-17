import './style.css';
import { Client, Databases, ID } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('67b157e600336980e6ee');

const databases = new Databases(client);

const form = document.querySelector('form');

form.addEventListener('submit', addUser);

function addUser(e) {
    e.preventDefault();

    const user = databases.createDocument(
        '67b1582900033fb8f3b0',
        '67b255d30012291837ee',
        ID.unique(),
        {
            "firstName": e.target.firstName.value,
            "lastName": e.target.lastName.value,
            "email": e.target.email.value,
        }
    );

    user.then(function (response) {
        addUsersToDOM();  // Refresh the list after adding a user
        form.reset();      // Clear the form
    }, function (error) {
        console.error("Error creating document:", error);
        alert("Error creating user. Please try again."); 
    });
}

async function addUsersToDOM() {
    document.querySelector('ul').innerHTML = ""; // Clear existing list items

    try {
        let response = await databases.listDocuments(
            "67b1582900033fb8f3b0",
            "67b255d30012291837ee"
        );

        response.documents.forEach((user) => {
            const li = document.createElement('li');

            const idSpan = document.createElement('span');
            idSpan.textContent = `ID: ${user['$id']}`;
            const br1 = document.createElement('br');
            const nameSpan = document.createElement('span');
            nameSpan.textContent = `User: ${user['firstName']} ${user['lastName']}`;
            const br2 = document.createElement('br');
            const emailSpan = document.createElement('span');
            emailSpan.textContent = `Email: ${user['email']}`;

            li.appendChild(idSpan);
            li.appendChild(br1);
            li.appendChild(nameSpan);
            li.appendChild(br2);
            li.appendChild(emailSpan);

            li.id = user.$id; // Set ID for removal

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener('click', () => removeUser(user.$id));
            li.appendChild(deleteBtn);
            

            document.querySelector('ul').appendChild(li);
        });
    } catch (error) {
        console.error("Error listing documents:", error);
        alert("Error loading users. Please try again."); 
    }
}

async function removeUser(id) {
    try {
        const result = await databases.deleteDocument(
            '67b1582900033fb8f3b0',
            '67b255d30012291837ee',
            id
        );
        console.log("Document deleted:", result);
        document.getElementById(id).remove();
    } catch (error) {
        console.error("Error deleting document:", error);
        alert("Error deleting user. Please try again."); 
    }
}

addUsersToDOM(); 