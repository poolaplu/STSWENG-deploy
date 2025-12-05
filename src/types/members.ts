import { Feeding } from "./feedings";
import { Household } from "./households";
import { Intervention } from "./interventions";


export type Member = {
    _id?: string;
    last_name: string;
    first_name: string;
    sex: string;
    birthdate?: string;
    weight?: string;
    contact_number?: string;
    marital_status: MARITAL_STATUS_TYPES;
    partner?: Member;
    occupation: string;
    guardians?: Member[];
    household?: Household;
    general_notes: string;
    sensitive_notes: string;
    _isNew?: boolean;
};

export const MARITAL_STATUS_NAMES = [
    "Single",
    "Single Parent",
    "Married",
    "Widowed",
    "Separated",
    "Partnered",
] as const;

export type MARITAL_STATUS_TYPES = (typeof MARITAL_STATUS_NAMES)[number];
