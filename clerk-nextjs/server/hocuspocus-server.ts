import { Server } from "@hocuspocus/server";
import mongoose from "mongoose";
import * as Y from "yjs";
import NoteState from "../models/NoteState";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in environment");
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Hocuspocus server connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Configure Hocuspocus Server
const hocuspocusServer = new Server({
  port: 3006,

  async onLoadDocument({ documentName }) {
    console.log(`[Hocuspocus] Loading document for room: ${documentName}`);
    try {
      const docState = await NoteState.findOne({ roomId: documentName });
      if (docState && docState.state) {
        console.log(`[Hocuspocus] Found existing document state in DB for room: ${documentName} (${docState.state.length} bytes)`);
        return new Uint8Array(docState.state);
      }
      console.log(`[Hocuspocus] No existing document state found for room: ${documentName}. Initializing empty.`);
      return null;
    } catch (err) {
      console.error(`[Hocuspocus] Error loading document ${documentName}:`, err);
      return null;
    }
  },

  async onStoreDocument({ documentName, document }) {
    const state = Y.encodeStateAsUpdate(document);
    console.log(`[Hocuspocus] Storing document for room: ${documentName} (${state.length} bytes)`);
    try {
      await NoteState.findOneAndUpdate(
        { roomId: documentName },
        {
          state: Buffer.from(state),
        },
        { upsert: true, new: true }
      );
      console.log(`[Hocuspocus] Successfully saved document state for room: ${documentName}`);
    } catch (err) {
      console.error(`[Hocuspocus] Error storing document ${documentName}:`, err);
    }
  },
});

hocuspocusServer.listen().then(() => {
  console.log("Hocuspocus Server is running on ws://localhost:3006");
});
