// src/app/(admin)/dashboard/page.tsx

import AdminExportButton from "@/app/components/AdminExportButton";
import InterventionReports from "./reports/intervention_reports";

export default async function DashboardPage() {
    return (
        <div className="space-y-4">
            {/* Flex container to align the button to the right.
               This places it neatly above the reports without the extra text.
            */}
            <div className="flex justify-end items-center pt-4 pr-4">
                <AdminExportButton />
            </div>

            {/* The Reports Section */}
            <InterventionReports />
        </div>
    );
}