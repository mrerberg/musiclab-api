import path from "node:path";
import fs from "node:fs";
import { parseFile } from "music-metadata";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";

import { Track } from "../src/models/track";

dotenv.config();

const __dirname = path.dirname(new URL(import.meta.url).pathname);

async function getTrackDuration(filePath: string) {
  try {
    const metadata = await parseFile(filePath);

    if (metadata.format.duration) {
      return metadata.format.duration;
    }

    return 0;
  } catch (error) {
    console.error(`Error reading metadata for ${filePath}:`, error);
    return 0;
  }
}

async function generateTrackData(file: string) {
  const mediaDir = path.join(__dirname, "../media");
  const filePath = path.join(mediaDir, file);

  const durationInSeconds = await getTrackDuration(filePath);

  return {
    name: faker.music.songName(),
    author: faker.music.artist(),
    releaseDate: faker.date.past({ years: 10 }).toISOString().split("T")[0],
    genre: faker.music.genre(),
    durationInSeconds: Math.round(durationInSeconds),
    album: faker.music.album(),
    previewUrl: `http://localhost:3000/media/${file}`,
    trackUrl: `http://localhost:3000/media/${file}`,
  };
}

async function seedDatabase() {
  try {
    const dbURI = process.env.MONGO_URI || "";

    await mongoose.connect(dbURI, {});

    const mediaDir = path.join(__dirname, "../media");
    const files = fs.readdirSync(mediaDir);

    const tracks = [];

    for (let i = 0; i < 100; i++) {
      const randomFile = files[Math.floor(Math.random() * files.length)];
      const trackData = await generateTrackData(randomFile);
      tracks.push(trackData);
    }

    await Track.deleteMany({});
    await Track.insertMany(tracks);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.disconnect();
  }
}

seedDatabase();
