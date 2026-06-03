import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Purchase } from '../src/models/purchase.schema';

async function deduplicate() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const purchaseModel = app.get<Model<Purchase>>(getModelToken('Purchase'));

  const pipeline = [
    { $group: { _id: { userRef: '$userRef', bookRef: '$bookRef' }, ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ];

  const duplicates = await purchaseModel.aggregate(pipeline).exec();

  for (const dup of duplicates) {
    // Keep the first one (oldest), remove the rest
    const [keep, ...remove] = dup.ids;
    await purchaseModel.deleteMany({ _id: { $in: remove } });
    console.log(`Cleaned ${remove.length} duplicate(s) for user=${dup._id.userRef}, book=${dup._id.bookRef}`);
  }

  console.log(`Total duplicate groups cleaned: ${duplicates.length}`);
  await app.close();
}

deduplicate().catch(console.error);
