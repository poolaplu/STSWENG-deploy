import mongoose, { Schema, model, models } from "mongoose";

const ProgramSchema = new Schema({
    title: { type: String, required: true },
    category: { type: String, default: "Outreach" }, 
    location: { type: String, default: "Manila" },
    
    description: { type: String, required: true }, 
    
    fullDescription: { type: String },     
    
    imageUrl: { type: String },
    
    objectives: { type: [String], default: [] },
    activities: { type: [String], default: [] },
    
    date_created: { type: String, required: true }, 
});

const ProgramModel = models.Program || model("Program", ProgramSchema);
export default ProgramModel;