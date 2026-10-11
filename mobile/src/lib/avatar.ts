import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { ApiError, api } from "./api";

/**
 * Lets the person pick or take a photo, crops it square, shrinks it to 512 px
 * and uploads it. Resolves false if they cancel.
 */
export async function chooseAvatar(from: "camera" | "library"): Promise<boolean> {
  // The system photo picker needs no permission: the app only sees the photo
  // the person picks. The camera does.
  if (from === "camera" && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
    throw new ApiError(0, "Imedica needs camera access. You can allow it in Settings.");
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 1 };
  const picked = from === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (picked.canceled || !picked.assets[0]) return false;

  const rendered = await ImageManipulator.manipulate(picked.assets[0].uri).resize({ width: 512 }).renderAsync();
  const photo = await rendered.saveAsync({ compress: 0.82, format: SaveFormat.JPEG });

  const body = new FormData();
  // Expo's fetch reads the bytes from an expo-file-system File; React
  // Native's { uri, name, type } descriptor isn't supported by it.
  body.append("file", new File(photo.uri));
  await api("POST", "/me/avatar", body);
  return true;
}

export function removeAvatar() {
  return api("DELETE", "/me/avatar");
}
