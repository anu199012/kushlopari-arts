import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { db, storage } from "./firebaseConfig";

export type CategoryDoc = {
  id: string;
  name: string;
  imageUrl?: string | null;
  images?: string[];
  order?: number;
  [key: string]: unknown;
};

const normalizeName = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const MODULE_ORDER = [
  "Rough Sketching",
  "Realistic Pencil Potrait",
  "Blood Art",
  "WaterColor Art",
  "Caricature Pencil Art",
  "Pet Potrait",
  "Oil's on canvas painting",
  "Oil's on wood plank",
  "Pencil on wood Plank",
  "MarkerDot Art",
  "NailString Art",
  "String Art",
];

const MODULE_ORDER_INDEX = new Map(
  MODULE_ORDER.map((name, index) => [normalizeName(name), index + 1])
);

function getSortKey(item: CategoryDoc) {
  if (typeof item.order === "number") return item.order;
  const name = normalizeName(item.name);
  const id = normalizeName(item.id);
  return (
    MODULE_ORDER_INDEX.get(name) ??
    MODULE_ORDER_INDEX.get(id) ??
    Number.MAX_SAFE_INTEGER
  );
}

function asImageList(data: Record<string, unknown>): string[] {
  const raw = data.images ?? data.image ?? data.imagesArray;
  if (Array.isArray(raw)) {
    return raw
      .map((it) =>
        typeof it === "string"
          ? it
          : (it as any)?.url ??
            (it as any)?.downloadURL ??
            (it as any)?.path ??
            null
      )
      .filter(Boolean) as string[];
  }
  if (typeof raw === "string" && raw.includes(",")) {
    return raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }
  if (typeof raw === "string" && raw.length) return [raw];
  return [];
}

export async function fetchCategories(): Promise<CategoryDoc[]> {
  const snap = await getDocs(collection(db, "categories"));
  const list: CategoryDoc[] = [];
  snap.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const name = String(
      data.name ?? data.title ?? data.categoryName ?? data.label ?? d.id
    );
    list.push({
      id: d.id,
      name,
      imageUrl: (data.imageUrl as string) ?? null,
      images: asImageList(data),
      order: typeof data.order === "number" ? data.order : undefined,
      ...data,
    });
  });
  return list.sort((a, b) => {
    const ao = getSortKey(a);
    const bo = getSortKey(b);
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  });
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadCategoryImage(
  categoryId: string,
  file: Blob,
  fileName: string
): Promise<string> {
  const path = `categories/${categoryId}/${Date.now()}_${safeFileName(fileName)}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
  });
  return getDownloadURL(storageRef);
}

/** Human-readable size helper for admin UI messages */
export function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function setCategoryCover(categoryId: string, url: string) {
  await updateDoc(doc(db, "categories", categoryId), {
    imageUrl: url,
  });
}

export async function addCategoryGalleryImage(
  categoryId: string,
  currentImages: string[],
  url: string,
  alsoSetCoverIfEmpty: boolean,
  currentCover?: string | null
) {
  const images = [...currentImages];
  if (!images.includes(url)) images.push(url);
  const payload: Record<string, unknown> = { images };
  if (alsoSetCoverIfEmpty && !currentCover) {
    payload.imageUrl = url;
  }
  await updateDoc(doc(db, "categories", categoryId), payload);
}

export async function removeCategoryGalleryImage(
  categoryId: string,
  currentImages: string[],
  urlToRemove: string,
  currentCover?: string | null
) {
  const images = currentImages.filter((u) => u !== urlToRemove);
  const payload: Record<string, unknown> = { images };
  if (currentCover === urlToRemove) {
    payload.imageUrl = images[0] ?? null;
  }
  await updateDoc(doc(db, "categories", categoryId), payload);

  // Best-effort delete from Storage when it's our bucket URL
  try {
    if (urlToRemove.includes("firebasestorage")) {
      const encoded = decodeURIComponent(
        urlToRemove.split("/o/")[1]?.split("?")[0] ?? ""
      );
      if (encoded) {
        await deleteObject(ref(storage, encoded));
      }
    }
  } catch {
    // Ignore storage delete failures (e.g. Cloudinary URLs)
  }
}
