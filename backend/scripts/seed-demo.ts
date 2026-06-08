import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from '../src/models/user.schema';
import * as bcrypt from 'bcrypt';

async function seedDemo() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken('User'));

  const email = 'demo@morenareinoso.com';
  const password = 'DemoPs123!';

  const existing = await userModel.findOne({ email }).exec();
  if (existing) {
    console.log(`Demo user already exists: ${email}`);
    await app.close();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await userModel.create({
    email,
    passwordHash,
    roles: [UserRole.ADMIN_DEMO],
    isActive: true,
  });

  console.log(`Demo user created: ${email} / ${password}`);
  await app.close();
}

seedDemo().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
