const mongoose = require('mongoose');

const uri = 'mongodb+srv://greendg2022_db_user:GaqnLGzEKoaEah9J@cluster0.54z2cww.mongodb.net/?appName=Cluster0';

mongoose.connect(uri)
  .then(() => {
    console.log('CONNECTED');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });