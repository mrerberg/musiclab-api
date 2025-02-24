import mongoose from "mongoose";

const TrackSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 50 },
  author: { type: String, required: true, maxlength: 50 },
  releaseDate: { type: String, required: true },
  genre: { type: String, required: true, maxlength: 50 },
  durationInSeconds: { type: Number, required: true },
  album: { type: String, maxlength: 50 },
  previewUrl: { type: String, required: false },
  trackUrl: { type: String, required: true },
});

export const Track = mongoose.model("Track", TrackSchema);
