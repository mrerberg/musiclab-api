import mongoose from "mongoose";

const TrackSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 150 },
  author: { type: String, required: true, maxlength: 150 },
  releaseDate: { type: String, required: true },
  genre: { type: String, required: true, maxlength: 150 },
  durationInSeconds: { type: Number, required: true },
  album: { type: String, maxlength: 150 },
  previewUrl: { type: String, required: false },
  trackUrl: { type: String, required: true },
});

export const Track = mongoose.model("Track", TrackSchema);
