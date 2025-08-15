const fs = require('fs');
const path = require('path');

// Read the all.json file
const allData = require('../data/all.json');

// Extract unique categories
const uniqueCategories = [...new Set(allData.map(item => item.category))];

// Create a map of categories with their descriptions
const categoryDescriptions = uniqueCategories.map(category => ({
    name: category,
    description: '', // You can add default descriptions here if needed
    createdAt: new Date(),
    updatedAt: new Date()
}));

// Write the categories to a new file
fs.writeFileSync(
    path.join(__dirname, '../data/categories.json'),
    JSON.stringify(categoryDescriptions, null, 2)
);

// Log the results
console.log(`Extracted ${uniqueCategories.length} unique categories:`);
console.log(uniqueCategories);

// Optional: Create a MongoDB seed file
const mongoSeedContent = `
db.categories.insertMany(${JSON.stringify(categoryDescriptions, null, 2)})
`;

fs.writeFileSync(
    path.join(__dirname, '../data/categorySeeds.js'),
    mongoSeedContent
);

console.log('\nFiles created:');
console.log('1. categories.json - Contains the extracted categories');
console.log('2. categorySeeds.js - MongoDB seed file for categories');