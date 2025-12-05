import { Transaction } from "./transactions";

export type Livelihood = {
    _id?: string;
    tempId?: string;
    name: string;
    date_created: string;
    transactions: Transaction[];
    last_modified: string;
    pinned: boolean;
    _isNew?: boolean;
};
