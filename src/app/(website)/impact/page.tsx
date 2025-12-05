import dbConnect from "@/lib/mongoose";
import PublicSiteContent from "@/lib/models/settings/public_site_content";
import { unstable_noStore as noStore } from 'next/cache';

import Header from '@/app/components/header';
import Footer from '@/app/components/footer';
import Impact from '@/app/components/impact';

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

export default async function ImpactPage() {
  const content: any = await getData();
  const impactData = content?.impact || {};

  return (
    <>
      <Header />
      <Impact 
      title={impactData.mainTitle}
      description={impactData.mainDescription}
      />
      <Footer />
    </>
  );
}