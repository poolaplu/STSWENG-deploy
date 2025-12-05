
import { Intervention } from "./interventions";
import { Member } from "./members";
export const CLUSTER_OPTIONS = ["Cluster 1", "Cluster 2", "Cluster 3", "Cluster 4", "Cluster 5"] as const;

export type Household = {
    _id?: string;
    name: string;
    head?: Member;
    cluster: string;
    ownership: string;
    hoa_last_reached_out: string;
    hoa_status: string;
    members: Member[];
    _isNew?: boolean;
};

export const OWNERSHIP_OPTIONS = ["RENT", "OWNED"] as const;
export const HOA_STATUS_OPTIONS = [
    "CONNECTED",
    "1ST",
    "2ND",
    "3RD",
    "4TH",
    "5TH",
    "6TH",
    "7TH",
    "8TH",
    "9TH",
    "10TH",
] as const;

