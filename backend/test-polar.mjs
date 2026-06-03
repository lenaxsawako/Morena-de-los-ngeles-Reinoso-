import mongoose from 'mongoose';
import { Polar } from '@polar-sh/sdk';
import { config } from 'dotenv';
config({ path: '.env' });

async function main() {
  // Connect to MongoDB
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env file');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Read polar config
  const config = await mongoose.connection.db.collection('siteconfigs').findOne({});
  const polar = config?.polar;
  if (!polar) {
    console.log('No polar config found in DB');
    await mongoose.disconnect();
    return;
  }

  console.log(`Polar config from DB:`);
  console.log(`  enabled: ${polar.enabled}`);
  console.log(`  server: ${polar.server}`);
  console.log(`  apiKey present: ${!!polar.apiKey}`);
  console.log(`  apiKey length: ${polar.apiKey?.length || 0}`);
  console.log(`  apiKey first 8: ${polar.apiKey ? polar.apiKey.substring(0, 8) + '...' : 'N/A'}`);

  if (!polar.enabled || !polar.apiKey) {
    console.log('Polar not fully configured');
    await mongoose.disconnect();
    return;
  }

  const server = polar.server || 'sandbox';
  const baseUrl = server === 'production' ? 'https://api.polar.sh' : 'https://sandbox-api.polar.sh';
  console.log(`\nCreating Polar client -> ${baseUrl}`);

  const client = new Polar({
    accessToken: polar.apiKey,
    server,
  });

  // Test 1: customers.list
  console.log('\n--- Test 1: customers.list ---');
  try {
    const customers = await client.customers.list({ limit: 1 });
    console.log('SUCCESS - customers.list works!');
    console.log(JSON.stringify(customers, null, 2).substring(0, 200));
  } catch (err) {
    console.log(`FAIL - ${err.message}`);
  }

  // Test 2: products.create (with cleanup)
  console.log('\n--- Test 2: products.create ---');
  const testName = `TEST BOOK ${Date.now()}`;
  try {
    const product = await client.products.create({
      name: testName,
      description: 'Temporary test product — delete me',
      prices: [{ amountType: 'fixed', priceCurrency: 'usd', priceAmount: 999 }],
      visibility: 'private',
    });
    console.log(`SUCCESS - products.create works! Created: ${product.id}`);

    // Clean up: archive the test product
    try {
      await client.products.update({
        id: product.id,
        productUpdate: { isArchived: true },
      });
      console.log('Test product archived (cleaned up)');
    } catch (cleanErr) {
      console.log(`Cleanup warning: ${cleanErr.message}`);
    }
  } catch (err) {
    console.log(`FAIL - ${err.message}`);
  }

  // Test 3: checkouts.create
  console.log('\n--- Test 3: checkouts.create ---');
  try {
    const checkout = await client.checkouts.create({
      products: ['dummy-product-id'],
      successUrl: 'https://example.com/success',
    });
    console.log('SUCCESS - checkouts.create works!');
    console.log(JSON.stringify(checkout, null, 2).substring(0, 200));
  } catch (err) {
    console.log(`EXPECTED FAIL - ${err.message}`);
  }

  await mongoose.disconnect();
  console.log('\nDone');
}

main().catch(console.error);
