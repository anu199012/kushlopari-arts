import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  addCategoryGalleryImage,
  CategoryDoc,
  fetchCategories,
  removeCategoryGalleryImage,
  setCategoryCover,
  uploadCategoryImage,
} from "@/src/adminApi";
import { adminSignIn, adminSignOut, useAdminAuth } from "@/src/adminAuth";

export default function AdminScreen() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const selected = categories.find((c) => c.id === selectedId) ?? null;

  const reload = useCallback(async () => {
    setListLoading(true);
    try {
      const list = await fetchCategories();
      setCategories(list);
      if (selectedId && !list.some((c) => c.id === selectedId)) {
        setSelectedId(list[0]?.id ?? null);
      } else if (!selectedId && list.length) {
        setSelectedId(list[0].id);
      }
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to load categories");
    } finally {
      setListLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin, reload]);

  const onSignIn = async () => {
    setAuthError("");
    setSigningIn(true);
    try {
      await adminSignIn(email, password);
    } catch (err: any) {
      setAuthError(err?.message ?? "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  };

  const pickFile = (mode: "gallery" | "cover") => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file || !selected) return;
        await handleUpload(file, mode);
      };
      input.click();
      return;
    }
    setStatus("File upload is supported on web admin for now.");
  };

  const handleUpload = async (file: Blob & { name?: string }, mode: "gallery" | "cover") => {
    if (!selected) return;
    setBusy(true);
    setStatus("Uploading…");
    try {
      const url = await uploadCategoryImage(
        selected.id,
        file,
        file.name || "image.jpg"
      );
      if (mode === "cover") {
        await setCategoryCover(selected.id, url);
        const images = selected.images ?? [];
        if (!images.includes(url)) {
          await addCategoryGalleryImage(
            selected.id,
            images,
            url,
            false,
            selected.imageUrl
          );
        }
      } else {
        await addCategoryGalleryImage(
          selected.id,
          selected.images ?? [],
          url,
          true,
          selected.imageUrl
        );
      }
      setStatus("Saved.");
      await reload();
    } catch (err: any) {
      setStatus(err?.message ?? "Upload failed. Check Auth + Storage rules.");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (url: string) => {
    if (!selected) return;
    setBusy(true);
    setStatus("Deleting…");
    try {
      await removeCategoryGalleryImage(
        selected.id,
        selected.images ?? [],
        url,
        selected.imageUrl
      );
      setStatus("Deleted.");
      await reload();
    } catch (err: any) {
      setStatus(err?.message ?? "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const onMakeCover = async (url: string) => {
    if (!selected) return;
    setBusy(true);
    try {
      await setCategoryCover(selected.id, url);
      setStatus("Cover updated.");
      await reload();
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to set cover");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.page}>
        <ActivityIndicator color="#fff" />
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.loginCard}>
          <Text style={styles.title}>Admin login</Text>
          <Text style={styles.hint}>
            Public visitors never see this. Sign in to manage module images.
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#777"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#777"
            secureTextEntry
            style={styles.input}
          />
          {authError ? <Text style={styles.error}>{authError}</Text> : null}
          <Pressable
            onPress={onSignIn}
            disabled={signingIn}
            style={[styles.primaryBtn, signingIn && styles.disabled]}
          >
            <Text style={styles.primaryBtnText}>
              {signingIn ? "Signing in…" : "Sign in"}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/")} style={styles.linkBtn}>
            <Text style={styles.linkText}>← Back to site</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Admin · Images</Text>
        <View style={styles.topActions}>
          <Pressable onPress={() => router.push("/")} style={styles.linkBtn}>
            <Text style={styles.linkText}>Site</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              await adminSignOut();
            }}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>Sign out</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.signedIn}>Signed in as {user?.email}</Text>

      <View style={styles.split}>
        <ScrollView style={styles.sideList}>
          {listLoading ? (
            <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
          ) : (
            categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedId(cat.id)}
                style={[
                  styles.catRow,
                  selectedId === cat.id && styles.catRowActive,
                ]}
              >
                <Text style={styles.catName} numberOfLines={2}>
                  {cat.name}
                </Text>
                <Text style={styles.catMeta}>
                  {(cat.images?.length ?? 0)} image(s)
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>

        <ScrollView style={styles.detail}>
          {!selected ? (
            <Text style={styles.hint}>Select a module</Text>
          ) : (
            <>
              <Text style={styles.detailTitle}>{selected.name}</Text>
              <Text style={styles.hint}>Cover</Text>
              {selected.imageUrl ? (
                <Image
                  source={{ uri: selected.imageUrl }}
                  style={styles.coverPreview}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.emptyAdmin}>
                  No images yet — upload the first photo.
                </Text>
              )}

              <View style={styles.btnRow}>
                <Pressable
                  disabled={busy}
                  onPress={() => pickFile("cover")}
                  style={[styles.primaryBtn, busy && styles.disabled]}
                >
                  <Text style={styles.primaryBtnText}>
                    {selected.imageUrl ? "Replace cover" : "Upload cover"}
                  </Text>
                </Pressable>
                <Pressable
                  disabled={busy}
                  onPress={() => pickFile("gallery")}
                  style={[styles.secondaryBtn, busy && styles.disabled]}
                >
                  <Text style={styles.secondaryBtnText}>Add gallery image</Text>
                </Pressable>
              </View>

              <Text style={[styles.hint, { marginTop: 18 }]}>Gallery</Text>
              {(selected.images?.length ?? 0) === 0 ? (
                <Text style={styles.emptyAdmin}>
                  No images yet — upload the first photo.
                </Text>
              ) : (
                selected.images!.map((url) => (
                  <View key={url} style={styles.galleryRow}>
                    <Image
                      source={{ uri: url }}
                      style={styles.thumb}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1, gap: 6 }}>
                      {selected.imageUrl === url ? (
                        <Text style={styles.coverBadge}>Cover</Text>
                      ) : (
                        <Pressable onPress={() => onMakeCover(url)}>
                          <Text style={styles.linkText}>Make cover</Text>
                        </Pressable>
                      )}
                      <Pressable onPress={() => onDelete(url)}>
                        <Text style={styles.deleteText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
          {status ? <Text style={styles.status}>{status}</Text> : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0b0b0b",
    padding: 16,
  },
  loginCard: {
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    marginTop: 48,
    gap: 12,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  hint: {
    color: "#999",
    fontSize: 13,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  primaryBtn: {
    backgroundColor: "#2979FF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryBtn: {
    backgroundColor: "#222",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  secondaryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  disabled: { opacity: 0.5 },
  error: { color: "#ff6b6b", fontSize: 13 },
  linkBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  linkText: { color: "#8ab4ff", fontSize: 14 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topActions: { flexDirection: "row", gap: 8 },
  signedIn: { color: "#777", fontSize: 12, marginBottom: 12 },
  split: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 0,
  },
  sideList: {
    width: 240,
    maxWidth: "35%",
    borderRightWidth: 1,
    borderRightColor: "#222",
    paddingRight: 8,
  },
  catRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: "#151515",
  },
  catRowActive: {
    backgroundColor: "#243b63",
  },
  catName: { color: "#fff", fontWeight: "600", fontSize: 13 },
  catMeta: { color: "#888", fontSize: 11, marginTop: 2 },
  detail: { flex: 1, paddingLeft: 4 },
  detailTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  coverPreview: {
    width: "100%",
    maxWidth: 420,
    height: 180,
    borderRadius: 10,
    backgroundColor: "#222",
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  emptyAdmin: {
    color: "#bbb",
    fontSize: 14,
    marginVertical: 8,
  },
  galleryRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#151515",
    padding: 8,
    borderRadius: 8,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  coverBadge: {
    color: "#9ad67a",
    fontSize: 12,
    fontWeight: "700",
  },
  deleteText: { color: "#ff7b7b", fontSize: 14 },
  status: { color: "#ccc", marginTop: 16, fontSize: 13 },
});
