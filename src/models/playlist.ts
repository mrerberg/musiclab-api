import mongoose from "mongoose";

const PlaylistSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 50 },
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Track" }],
});

export const Playlist = mongoose.model("Playlist", PlaylistSchema);
