import Constants from "expo-constants";

// TODO: DELETE THIS COMMENT AND REPLACE VALUES BELOW
// 1. Go to Cloudinary Console > Settings > Upload > Upload presets
// 2. Click "Add upload preset"
// 3. Set "Signing Mode" to "Unsigned" (CRITICAL!)
// 4. Copy the "Upload preset name"
const CLOUD_NAME = "dhzckqyuu"; // e.g. "dxyz123"
const UPLOAD_PRESET = "kraftkonect_unsigned"; // e.g. "kraftkonect_unsigned"

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export const uploadImageToCloudinary = async (
  imageUri: string
): Promise<string> => {
  if (!imageUri) {
    throw new Error("No image URI provided");
  }

  const formData = new FormData();

  // Create a file object for the image
  const filename = imageUri.split("/").pop() || "image.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  // @ts-ignore: FormData expects a Blob or File on web, but React Native handles { uri, type, name }
  formData.append("file", {
    uri: imageUri,
    name: filename,
    type,
  });

  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "providers"); // Optional: organize uploads in a folder

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData as any,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    });

    const data: any = await response.json();

    if (response.ok) {
      return data.secure_url;
    } else {
      console.error("Cloudinary upload failed:", data);
      throw new Error(data.error?.message || "Failed to upload image");
    }
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};
