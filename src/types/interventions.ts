import { Member } from "./members";
import { Household } from "./households";

export type Intervention = {
    _id?: string;
    name: string;
    description?: string;
    date: string;
    sensitive: boolean;
    type: string;
    expenditures: string[];
    beneficiaries_member?: Member[];
    beneficiaries_household?: Household[];
    beneficiaries_cluster?: string[];
    pinned: boolean;
    last_modified: string;
};
