/**
 * Test file for Cost-Aware Routing System
 */

import { CostAwareRoutingFactory, OperationType } from './routing.js';

async function testCostAwareRouting() {
  console.log('Testing Cost-Aware Routing System...\n');

  // Create the routing system
  const { router, database, tracker } = CostAwareRoutingFactory.createDefaultSystem();

  // Test 1: Route text generation
  console.log('Test 1: Text Generation Routing');
  try {
    const textModel = await router.routeOperation(OperationType.TEXT_GENERATION, {
      minQuality: 'standard',
    });
    console.log(
      `Selected model: ${textModel.provider}:${textModel.modelId} (${textModel.cost.tier})`
    );
    console.log(
      `Cost estimate: $${router.getCostEstimate(textModel, OperationType.TEXT_GENERATION, { maxTokens: 1000 })}`
    );
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 2: Route image generation
  console.log('\nTest 2: Image Generation Routing');
  try {
    const imageModel = await router.routeOperation(OperationType.IMAGE_GENERATION);
    console.log(
      `Selected model: ${imageModel.provider}:${imageModel.modelId} (${imageModel.cost.tier})`
    );
    console.log(
      `Cost estimate: $${router.getCostEstimate(imageModel, OperationType.IMAGE_GENERATION)}`
    );
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 3: Check analytics
  console.log('\nTest 3: Analytics');
  const analytics = tracker.getAnalytics();
  console.log(`Total cost: $${analytics.totalCost}`);
  console.log(`Total operations: ${analytics.totalOperations}`);
  console.log(
    `Free tier usage: ${analytics.freeTierUsage.used}/${analytics.freeTierUsage.limit} (${analytics.freeTierUsage.percentage.toFixed(1)}%)`
  );
  if (analytics.recommendations.length > 0) {
    console.log('Recommendations:');
    analytics.recommendations.forEach(rec => console.log(`- ${rec}`));
  }

  // Test 4: Show available models
  console.log('\nTest 4: Available Models');
  console.log('Free models:');
  database.getFreeModels().forEach(model => {
    console.log(`- ${model.provider}:${model.modelId} (${model.capabilities.quality})`);
  });
  console.log('Paid models:');
  database.getPaidModels().forEach(model => {
    console.log(`- ${model.provider}:${model.modelId} ($${model.cost.costPerOperation})`);
  });
}

// Run the test
testCostAwareRouting().catch(console.error);
