const { subtle } = require('crypto').webcrypto;
const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  const messages = await db.collection('messages').find({}).sort({ createdAt: -1 }).limit(1).toArray();
  const latestMsg = messages[0];
  console.log('Latest message in DB:', {
    _id: latestMsg._id,
    sender: latestMsg.sender,
    receiver: latestMsg.receiver,
    content: latestMsg.content,
    isEncrypted: latestMsg.isEncrypted,
    iv: latestMsg.iv,
    createdAt: latestMsg.createdAt
  });
  
  const senderUser = users.find(u => u._id.toString() === latestMsg.sender.toString());
  const receiverUser = users.find(u => u._id.toString() === latestMsg.receiver.toString());
  console.log('Sender user:', senderUser.name || senderUser.username, 'publicKey exists:', !!senderUser.publicKey);
  console.log('Receiver user:', receiverUser.name || receiverUser.username, 'publicKey exists:', !!receiverUser.publicKey);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
