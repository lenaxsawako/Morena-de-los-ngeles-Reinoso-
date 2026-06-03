require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set in .env');
  process.exit(1);
}

mongoose.connect(uri)
  .then(() => {
    console.log('CONNECTED');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });