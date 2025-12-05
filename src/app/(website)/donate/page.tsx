import dbConnect from "@/lib/mongoose";
import PublicSiteContent from "@/lib/models/settings/public_site_content";
import { unstable_noStore as noStore } from 'next/cache';

import Donate from '@/app/components/donate'; 
import Header from '@/app/components/header'; 
import Footer from '@/app/components/footer'; 


export const dynamic = "force-dynamic";

async function getData() {
  noStore();
  try {
    await dbConnect();
    const data = await PublicSiteContent.findOne().lean();
    return data || {};
  } catch (error) {
    return {};
  }
}

export default async function DonatePage() {
  const content: any = await getData();
  const donateData = content?.donate || {};

  return (
    <>
    <Header/>
    <Donate 
      gcashNumber={donateData.gcashNumber}
      bankDetails={donateData.bankDetails}
      otherDetails={donateData.otherDetails}
    />
    <Footer/>
    </>
  );
}