import mongoose from "mongoose";

const PlaylistSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 50 },
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Track" }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

export const Playlist = mongoose.model("Playlist", PlaylistSchema);
