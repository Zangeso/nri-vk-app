import { supabase } from '../supabase.js';
import { getFileExtension } from '../utils.js';

export async function uploadImage(blob, bucket, prefix) {
if (!blob) return null;

const fileName = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}.jpg`;

const { error } = await supabase.storage
.from(bucket)
.upload(fileName, blob, {
contentType: "image/jpeg",
upsert: false
});

if (error) throw error;

const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
return data.publicUrl;
}

export async function uploadAudio(file, prefix) {
if (!file) return null;

const extension = getFileExtension(file.name) || "mp3";
const safeName = `${prefix}_${Date.now()}.${extension}`;

const { error } = await supabase.storage
.from("tracks")
.upload(safeName, file, {
contentType: file.type || "audio/mpeg",
upsert: false
});

if (error) throw error;

const { data } = supabase.storage.from("tracks").getPublicUrl(safeName);
return data.publicUrl;
}
