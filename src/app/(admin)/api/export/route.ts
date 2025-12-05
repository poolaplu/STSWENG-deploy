// src/app/api/export/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { unparse } from 'papaparse'; // Import CSV parser
import JSZip from 'jszip'; // Import zip library
import { flatten } from 'flat';

// Import the 6 models
import Member from '@/lib/models/households/member';
import Household from '@/lib/models/households/household';
import Donation from '@/lib/models/donations/donation';
import Intervention from '@/lib/models/interventions/intervention';
import FeedingProgram from '@/lib/models/feeding/feeding_program';
import Livelihood from '@/lib/models/business/livelihood';

// Imports for population
import '@/lib/models/feeding/feeding_child';
import '@/lib/models/business/transaction'; 

const papaparseConfig = { delimiter: ";", header: true, bom: true };

async function isAdmin(request: Request) { return true; }

// --- HELPER FUNCTIONS ---

async function getMembersData() {
  const rawMembers = await Member.find({})
    .populate('guardians', 'first_name last_name')
    .populate('household', 'name')
    .lean();

  return (rawMembers as any[]).map((member) => {
    // Format Guardians
    if (Array.isArray(member.guardians) && member.guardians.length > 0) {
      member.guardians = member.guardians
        .map((g: any) => g.first_name ? `${g.first_name} ${g.last_name}` : '')
        .filter((n: string) => n !== "").join(', ');
    } else { member.guardians = ""; }

    // Format Household
    if (member.household && member.household.name) {
      member.household = member.household.name;
    } else { member.household = ""; }

    delete member.sensitive_notes; 
    return member;
  });
}

async function getHouseholdsData() {
  const rawHouseholds = await Household.find({})
    .populate('members', 'first_name last_name')
    .lean();

  return (rawHouseholds as any[]).map((hh) => {
    if (Array.isArray(hh.members) && hh.members.length > 0) {
      hh.members = hh.members
        .map((m: any) => m.first_name ? `${m.first_name} ${m.last_name}` : '')
        .filter((n: string) => n !== "").join(', ');
    } else { hh.members = ""; }
    return hh;
  });
}

async function getInterventionsData() {
  const rawInterventions = await Intervention.find({})
    .populate('beneficiaries_member', 'first_name last_name')
    .populate('expenditures')
    .lean();

  return (rawInterventions as any[]).map((intervention) => {
    // Format Beneficiaries
    if (Array.isArray(intervention.beneficiaries_member) && intervention.beneficiaries_member.length > 0) {
      intervention.beneficiaries_member = intervention.beneficiaries_member
        .map((b: any) => b.first_name ? `${b.first_name} ${b.last_name}` : '')
        .filter((n: string) => n !== "").join(', ');
    } else { intervention.beneficiaries_member = ""; }

    // Format Expenditures: Date, Item, Price, Quantity
    if (Array.isArray(intervention.expenditures) && intervention.expenditures.length > 0) {
      intervention.expenditures = intervention.expenditures
        .map((t: any) => {
          const dateVal = t.date || t.createdAt || new Date();
          const dateStr = new Date(dateVal).toLocaleDateString('en-US');
          const item = t.description || t.name || t.item || t.category || "Item";
          
          let price = "0";
          if (t.amount != null) price = t.amount;
          else if (t.price != null) price = t.price;
          else if (t.cost != null) price = t.cost;
          else if (t.value != null) price = t.value;

          const qty = t.quantity || t.qty || t.count || "1";
          return `${dateStr}, ${item}, ${price}, ${qty}`;
        })
        .join('; ');
    } else { intervention.expenditures = ""; }

    // Remove unwanted columns
    delete intervention.beneficiaries_household;
    delete intervention.beneficiaries_cluster;
    return intervention;
  });
}

async function getFeedingData() {
  const rawFeeding = await FeedingProgram.find({})
    .populate({
      path: 'beneficiaries',
      populate: { path: 'idMember', select: 'first_name last_name' }
    })
    .lean();

  return (rawFeeding as any[]).map((program) => {
    if (Array.isArray(program.beneficiaries) && program.beneficiaries.length > 0) {
      program.beneficiaries = program.beneficiaries
        .map((b: any) => {
          const member = b.idMember;
          if (member && member.first_name) return `${member.first_name} ${member.last_name}`;
          return "";
        })
        .filter((n: string) => n !== "").join(', ');
    } else { program.beneficiaries = ""; }
    return program;
  });
}

async function getLivelihoodsData() {
  const rawLivelihoods = await Livelihood.find({}).populate('transactions').lean();
  
  return (rawLivelihoods as any[]).map((livelihood) => {
    if (Array.isArray(livelihood.transactions) && livelihood.transactions.length > 0) {
      livelihood.transactions = livelihood.transactions
        .map((t: any) => {
           // Date, Item, Price, Quantity
           const dateVal = t.date || t.createdAt || new Date();
           const dateStr = new Date(dateVal).toLocaleDateString('en-US');
           const item = t.description || t.name || t.item || t.category || "Transaction";
           
           let price = "0";
           if (t.amount != null) price = t.amount;
           else if (t.price != null) price = t.price;
           else if (t.cost != null) price = t.cost;
           else if (t.value != null) price = t.value;

           const qty = t.quantity || t.qty || t.count || "1";
           return `${dateStr}, ${item}, ${price}, ${qty}`;
        })
        .join('; ');
    } else { livelihood.transactions = ""; }
    return livelihood;
  });
}

// 👇 UPDATED FUNCTION: Removes the name column
async function getDonationsData() {
  const rawDonations = await Donation.find({}).lean();
  
  return (rawDonations as any[]).map((donation) => {
    // Delete the name column for privacy
    delete donation.name; 
    return donation;
  });
}

// --- MAIN API HANDLER ---

export async function GET(request: Request) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); 

  try {
    await dbConnect();

    // 1. IF SPECIFIC TYPE REQUESTED
    if (type) {
      let data: any[] = [];
      let filename = `${type}.csv`;

      switch (type) {
        case 'members': data = await getMembersData(); break;
        case 'households': data = await getHouseholdsData(); break;
        case 'interventions': data = await getInterventionsData(); break;
        case 'feeding': data = await getFeedingData(); break;
        case 'livelihoods': data = await getLivelihoodsData(); break;
        case 'donations': data = await getDonationsData(); break;
        default: return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }

      const csv = unparse(data, papaparseConfig);
      
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // 2. IF NO TYPE (Export All)
    const [members, households, donations, interventions, feeding, livelihoods] = await Promise.all([
      getMembersData(),
      getHouseholdsData(),
      getDonationsData(),
      getInterventionsData(),
      getFeedingData(),
      getLivelihoodsData(),
    ]);

    const zip = new JSZip();
    zip.file("members.csv", unparse(members, papaparseConfig));
    zip.file("households.csv", unparse(households, papaparseConfig));
    zip.file("donations.csv", unparse(donations, papaparseConfig));
    zip.file("interventions.csv", unparse(interventions, papaparseConfig));
    zip.file("feeding_programs.csv", unparse(feeding, papaparseConfig));
    zip.file("livelihoods.csv", unparse(livelihoods, papaparseConfig));

    const zipBlob = await zip.generateAsync({ type: "blob" });

    return new Response(zipBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="data-export-${new Date().toISOString().split('T')[0]}.zip"`,
      },
    });

  } catch (error) {
    console.error('Data export failed:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}