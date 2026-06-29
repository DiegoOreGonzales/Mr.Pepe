const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('admin123456', 10);
console.log('BCRYPT_HASH:', hash);
