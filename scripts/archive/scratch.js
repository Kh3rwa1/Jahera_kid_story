const { Client, Account } = require('node-appwrite');
const sdk = require('react-native-appwrite');
console.log(Object.keys(sdk.Account.prototype).filter(k => k.includes('Status')));
