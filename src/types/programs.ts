export interface Program {
  _id?: string;
  title: string;
  category: string;
  location: string;
  description: string;      
  fullDescription: string;  
  imageUrl: string;
  objectives: string[];     
  activities: string[];     
  date_created?: string;
}