import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headerPayload = await headers();

  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing headers", {
      status: 400,
    });
  }

  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!CLERK_WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET in environment variables");
    return new Response("Webhook Secret not configured", {
      status: 500,
    });
  }

  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let evt: any;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err: any) {
    console.error("Error verifying webhook signature:", err.message);
    return new Response("Invalid signature", {
      status: 400,
    });
  }

  const { data, type: eventType } = evt;

  try {
    await connectDB();

    if (eventType === "user.created") {
      await User.create({
        clerkId: data.id,
        name:
          `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
        email: data.email_addresses?.[0]?.email_address || "",
        image: data.image_url || "",
      });
      console.log(`User created via webhook: ${data.id}`);
    } else if (eventType === "user.updated") {
      await User.findOneAndUpdate(
        { clerkId: data.id },
        {
          name:
            `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
          email: data.email_addresses?.[0]?.email_address || "",
          image: data.image_url || "",
        },
        { upsert: true }
      );
      console.log(`User updated via webhook: ${data.id}`);
    } else if (eventType === "user.deleted") {
      await User.findOneAndDelete({ clerkId: data.id });
      console.log(`User deleted via webhook: ${data.id}`);
    }
  } catch (dbError: any) {
    console.error("Database error during webhook handling:", dbError.message);
    return new Response("Database error", {
      status: 500,
    });
  }

  return Response.json({
    success: true,
  });
}
