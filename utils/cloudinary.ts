import { Platform } from "react-native";

// Existing public profile-photo destination. Private ID/selfie uploads use separate backend contracts.
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dhzckqyuu/image/upload";
const UPLOAD_PRESET = "kraftkonect_unsigned";

export async function uploadImageToCloudinary(imageUri: string, isCurrent: () => boolean = () => true): Promise<string> {
  const assertCurrent = () => { if (!isCurrent()) throw new Error("The signed-in account changed. Please select the photo again."); };
  assertCurrent();
  if (!imageUri || typeof imageUri !== "string") throw new Error("No image was selected.");
  const filename = imageUri.split(/[?#]/)[0].split("/").pop() || "profile-photo.jpg";
  const extension = /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.exec(filename)?.[1].toLowerCase();
  const type = extension ? "image/" + (extension === "jpg" ? "jpeg" : extension) : "image/jpeg";
  const formData = new FormData();
  if (Platform.OS === "web") {
    const selected = await fetch(imageUri);
    assertCurrent();
    if (!selected.ok) throw new Error("The selected photo could not be read.");
    const blob = await selected.blob();
    assertCurrent();
    if (!blob.size || !/^image\/(jpeg|png|webp|gif|heic|heif|avif)$/i.test(blob.type)) throw new Error("Please select a supported image.");
    // React Native's FormData typing omits the browser's three-argument append(name, blob, filename).
    const webForm = formData as unknown as { append(name: string, value: Blob, filename?: string): void };
    webForm.append("file", blob, extension ? filename : "profile-photo." + (blob.type.slice(6) === "jpeg" ? "jpg" : blob.type.slice(6)));
  } else {
    // React Native's FormData supports its native URI file shape.
    formData.append("file", { uri: imageUri, name: filename, type } as unknown as Blob);
  }
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "providers");
  assertCurrent();
  // Fetch supplies the multipart boundary on both native and web.
  // Expo's native and web ambient FormData declarations differ, but fetch accepts each platform's instance.
  const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData as unknown as NonNullable<Parameters<typeof fetch>[1]>["body"], headers: { Accept: "application/json" } });
  assertCurrent();
  if (!response.ok) throw new Error("The photo upload failed. Please try again.");
  const data: unknown = await response.json();
  assertCurrent();
  const url = data && typeof data === "object" && "secure_url" in data ? data.secure_url : undefined;
  if (typeof url !== "string" || !/^https:\/\/res\.cloudinary\.com\/dhzckqyuu\//.test(url)) throw new Error("The uploaded photo could not be confirmed.");
  return url;
}
