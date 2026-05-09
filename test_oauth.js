const { Client, Account, OAuthProvider } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('69b5657c000d2c28a436');
const account = new Account(client);

const url = account.createOAuth2Token(OAuthProvider.Google, 'exp://192.168.0.103:8081/', 'exp://192.168.0.103:8081/');
console.log(url);
