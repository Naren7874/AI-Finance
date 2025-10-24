import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "./prisma.js";

export const checkUser = async () => {
    const user = await currentUser();
    if(!user) {
        return null;
    }
    try {
        const logedInUser = await prisma.user.findUnique({
            where: {
                clerkUserId: user.id
            }
        })
        if(logedInUser) {
            return logedInUser;
        }
        else {
            const name = `${user.firstName} ${user.lastName||" "}`.trim();
            const newUser = await prisma.user.create({
                data: {
                    clerkUserId: user.id,
                    name: name || null,
                    imageUrl: user.imageUrl || null,
                    email: user.emailAddresses[0]?.emailAddress
                }
            })
            return newUser;
        }   
    } catch (error) {
        console.log("Error in checkUser:", error.message);
        return null;
    }
}