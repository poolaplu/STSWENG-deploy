import dbConnect from "@/lib/mongoose";
import PublicSiteContent, { IPublicSiteContent } from "@/lib/models/settings/public_site_content";
import { unstable_noStore as noStore } from 'next/cache';

async function getFooterData() {
  noStore(); 
  try {
    await dbConnect();
    const data = await PublicSiteContent.findOne().lean<IPublicSiteContent>();
    
    return data;
  } catch (error) {
    console.error("Footer DB Error:", error);
    return null;
  }
}

export default async function Footer() {
  const content = await getFooterData();
  
  const footerData = content?.footer || {
    description: "Lorem ipsum dolor sit amet...",
    email: "sample@email.org",
    phone: "+63 912 345 6789",
    address: "Manila, Philippines"
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>SYNAGOGUE FOR JESUS</h3>
            <p>{footerData.description}</p>
          </div>
          <div className="footer-section">
            <h4>Contact Us</h4>
            <p>Email: {footerData.email}</p>
            <p>Phone: {footerData.phone}</p>
            <p>Address: {footerData.address}</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About Us</a></li>
              <li><a href="/prog">Our Programs</a></li>
              <li><a href="/donate">Donate</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Synagogue For Jesus, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}