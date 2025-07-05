# Database 2 Project

## Team 24

Krzysztof Barałkiewicz, Marek Dzięcioł, Jakub Jurczak, Wiktor Kruk, Jakub Mieczkowski

## Project Topic

The project is a messenger application that allows users to chat with friends over the internet. An additional feature is end-to-end message encryption.

## Technologies Used

* React (Frontend)
* NodeJS (WebSocket)
* ASP.NET (Backend)
* PostgreSQL (Database)

## ER Database Model

![](dokumentacja/ER_diagram.png)

## Description of Web Application Features

**1. Login**

![](dokumentacja/login.png)

Upon opening the website, a login option is displayed. Users must enter their email and password.

**2. User Registration**

![](dokumentacja/register.png)

Clicking the “Create account” button switches the view from login to registration. To create an account, simply fill in the fields shown above.

**3. Chat List / Main Menu**

![](dokumentacja/list.png)

After logging in or creating an account, a list of recent chats is displayed. On the right side, the number of unread messages is shown, along with the option to delete a chat.

![](dokumentacja/search.png)

Users can also search for other users to chat with.

**4. Private Chats**

![](dokumentacja/chat.png)

The functionality is similar to popular messengers like Messenger or WhatsApp. Messages can be deleted on both sides using the "X" button.

## Encryption

Each user receives two keys during registration for hybrid encryption. This covers the encryption of conversation data — messages are only decrypted when displayed on screen.

```json

{
"id": 4,
"name": "ajax",
"publicKey": "-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAg2Wb5+i22vqAS8xaBuCcYPBjsSFrWDNjcQNDIv/iWq9DIptezCQU\n...\n-----END RSA PUBLIC KEY-----",
"privateKey": "-----BEGIN ENCRYPTED PRIVATE KEY-----\nMIIFJTBfBgkqhkiG9w0BBQ0wUjAxBgkqhkiG9w0BBQwwJAQQgU8k8K+4vplayb/E\n...\n-----END ENCRYPTED PRIVATE KEY-----",
"createdAt": "2025-06-22T20:08:25.149492Z"
}

```

*Information received about the logged-in user.*

```json
{
  "id": 225,
  "content": "8nEvgYjc/FJDimdm+opcbrbv2KFcIi/e/tLGeJhtHL4=",
  "conversationId": 19,
  "conversationName": "wiktor3 ajax",
  "author": {
    "id": 4,
    "name": "ajax",
    "publicKey": "",
    "createdAt": "2025-06-22T20:08:25.149492Z"
  },
  "timestamp": "2025-06-22T20:52:30.497351Z"
},
{
  "id": 224,
  "content": "pHUBlTREKz3jJm5PmQOVWTweBH3M5cgHyIc2OQaZHou61+rtPXGf5gexSQ==",
  "conversationId": 19,
  "conversationName": "wiktor3 ajax",
  "author": {
    "id": 6,
    "name": "wiktor3",
    "publicKey": "",
    "createdAt": "2025-06-22T20:44:53.296901Z"
  },
  "timestamp": "2025-06-22T20:51:55.546531Z"
}
````

*Example of encrypted **message blocks** from a conversation.*

## Frontend

The frontend uses the *node-forge* library for encryption.
It has two main views: *login* and *chatapp*.

The *chatapp* consists of *ChatList* and *ChatRoom*.

Messages in *ChatRoom* use lazy loading (initially only 50 messages are loaded; more are loaded when scrolling up).

The style and appearance are built using *tailwindcss*.

## WebSocket

A simple server used to handle WebSocket messaging.
It receives information from the frontend that someone has sent a message, and if the recipient is currently viewing that conversation, they are notified via WebSocket to fetch the new messages.

This enables faster and more efficient message refreshing.
