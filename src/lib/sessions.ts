import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const getSessionUser = async () => {
    const session = await getServerSession(authOptions);
    return session?.user || null;
};
