## Project Description

This project enhances the digital presence of Synagogue for Jesus, an organization based in Montalban, Rizal, dedicated to providing relief goods and assistance to those in need. Our goal is to improve their website with quality-of-life features for better data formatting, export capabilities, and a public dashboard with blogging functionality.

The application features:
- Enhanced data management and formatting tools
- Clean, printable output options
- Public dashboard for community engagement
- Editable blog and content management in the admin panel
- Improved social media integration for greater outreach

# Pre-requisites
Navigate to the project folder and run:
``npm install``
Create the ``.env.local`` variable in the root directory containing:
``

``# .env.local
MONGODB_URI="Your Details"
REGISTRATION_SECRET_HASH=Your Details
PASSPHRASE="sfj-registration-key"
NEXTAUTH_SECRET="Your Details"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CLOUDINARY_CLOUD="Your Cloudinary Cloud"
CLOUDINARY_KEY="Your Cloudinary Key"
CLOUDINARY_SECRET="Your Cloudinary Secret"``

# Build
Navigate to the project folder and run:
``npm run dev``
