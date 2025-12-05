// src/app/api/seed/route.js

import { NextResponse } from 'next/server';
import connectToDB from "@/lib/mongoose"; // Make sure this path is correct
import Category from "@/models/Category";
// Uncomment the line below if you want to install and use faker
// import { faker } from '@faker-js/faker';

export async function GET(request) {
  // 1. Connect to the database
  await connectToDB();

  try {
    // 2. Clear existing data (optional)
    await Category.deleteMany({});
    console.log("Cleared existing categories.");

    // 3. Create new dummy data
    const categoriesToCreate = [
      { name: "Laptops" },
      { name: "Smartphones" },
      { name: "Cameras" },
      { name: "Gaming Consoles" },
      // Example using Faker:
      // { name: faker.commerce.department() } 
    ];

    await Category.insertMany(categoriesToCreate);
    console.log("Seeded new categories.");

    // 4. Send a success response
    return NextResponse.json({ message: "Database seeded successfully!" }, { status: 200 });

  } catch (error) {
    console.error("Error seeding database:", error);
    // 5. Send an error response
    return NextResponse.json({ message: "Error seeding database", error: error.message }, { status: 500 });
  }
}
