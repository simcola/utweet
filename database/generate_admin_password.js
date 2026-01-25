// Script to generate a bcrypt password hash for admin users
// Usage: node generate_admin_password.js [password]
// If no password is provided, it will prompt for one

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateHash(password) {
  const saltRounds = 10;
  const hash = bcrypt.hashSync(password, saltRounds);
  console.log('\nPassword hash generated:');
  console.log(hash);
  console.log('\nSQL INSERT statement:');
  console.log(`INSERT INTO admin_users (username, password_hash) VALUES ('admin', '${hash}');`);
  console.log('\nOr to create a different username:');
  console.log(`INSERT INTO admin_users (username, password_hash) VALUES ('your_username', '${hash}');`);
}

const password = process.argv[2];

if (password) {
  generateHash(password);
  rl.close();
} else {
  rl.question('Enter password for admin user: ', (password) => {
    generateHash(password);
    rl.close();
  });
}

