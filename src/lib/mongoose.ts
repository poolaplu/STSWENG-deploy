import mongoose from "mongoose";

const connection: { isConnected?: number } = {};

const dbConnect = async () => {
    if (connection.isConnected) return;

    console.log("Connecting to MongoDB...");

    const db = await mongoose.connect(process.env.MONGODB_URI!);

    connection.isConnected = db.connections[0].readyState;
};

export default dbConnect;
