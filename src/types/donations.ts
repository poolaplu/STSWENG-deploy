export type Donation = {
  _id?: string;
  date: string;
  isItem: boolean;
  name: string;
  value: number;
  donor_name: string;
  contact_no?: string;
  _isNew?: boolean;
};