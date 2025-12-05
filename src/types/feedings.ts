export const FeedingProgramStatus = ["To Be Done", "Ongoing", "Done"] as const;

export type Feeding = {
    _id?: string;
    name: string;
    description?: string;
    date_started: string;
    date_ended?: string;
    last_modified: string;
    status: string;
    beneficiaries?: FeedingChild[];
    pinned: boolean;
    _isNew?: boolean;
};

export type FeedingChild = {
    _id?: string;
    idMember: string | { _id: string; first_name: string; last_name: string };
    weight_initial?: number;
    height_initial?: number;
    weight_third?: number;
    height_third?: number;
    weight_sixth?: number;
    height_sixth?: number;
    weight_ninth?: number;
    height_ninth?: number;
    weight_twelvth?: number;
    height_twelvth?: number;
};
