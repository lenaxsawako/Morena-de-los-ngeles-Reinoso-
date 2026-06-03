const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  purchasedBooks: {
    type: [String],
    default: [],
  },
  roles: {
    type: [String],
    enum: ['user', 'admin'],
    default: ['user'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/lbb';
    
    console.log('📡 Conectando a MongoDB:', mongoUrl);
    await mongoose.connect(mongoUrl);
    console.log('✅ Conectado a MongoDB');

    // Verificar si el admin ya existe
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin ya existe:', existingAdmin.email);
      process.exit(0);
    }

    // Crear contraseña hasheada
    const password = 'Admin@123456';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario admin
    const admin = new User({
      email: 'admin@example.com',
      passwordHash,
      roles: ['admin', 'user'],
      isActive: true,
      emailVerified: true,
    });

    await admin.save();
    console.log('✅ Admin creado exitosamente');
    console.log('📧 Email:', admin.email);
    console.log('🔐 Contraseña:', password);
    console.log('👤 Roles:', admin.roles);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
