import dbConnect from "@/lib/mongoose";
import PublicSiteContent from "@/lib/models/settings/public_site_content";
import { unstable_noStore as noStore } from 'next/cache';

import About from '@/app/components/about'; 
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";


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

export default async function AboutPage() {
  const content: any = await getData();
  const aboutData = content?.about || {};

  return (
    <>
    <Header />
    <About 
      mission={aboutData.mission}
      vision={aboutData.vision}
      history={aboutData.history}
    />
    <Footer />
    </>
  );
}